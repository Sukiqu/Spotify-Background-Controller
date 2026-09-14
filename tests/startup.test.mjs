import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, cp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const source = fileURLToPath(new URL('../', import.meta.url));
const request = JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18'}})+'\n';
for (const scenario of ['valid','modified manifest','missing manifest','missing signature','invalid key']) {
  test(`MCP startup: ${scenario}`, async () => {
    const temp = await mkdtemp(path.join(tmpdir(),'spotify-startup-test-'));
    try {
      const pkg = path.join(temp,'package');
      await cp(source,pkg,{recursive:true});
      const metadata = path.join(pkg,'.codex-plugin');
      if (scenario === 'modified manifest') {
        const target = path.join(metadata,'plugin.json');
        await writeFile(target,Buffer.concat([await readFile(target),Buffer.from(' ')]));
      }
      if (scenario === 'missing manifest') await rm(path.join(metadata,'plugin.json'));
      if (scenario === 'missing signature') await rm(path.join(metadata,'plugin.json.sig'));
      if (scenario === 'invalid key') await writeFile(path.join(metadata,'public-key.pem'),'invalid');
      const run = spawnSync(process.execPath,[path.join(pkg,'scripts/server.mjs')],{
        input:request,encoding:'utf8',timeout:15000,
        env:{...process.env,SPOTIFY_BACKGROUND_DATA_DIR:path.join(temp,'empty-state')}
      });
      assert.ifError(run.error);
      if (scenario === 'valid') {
        assert.equal(run.status,0,run.stderr);
        assert.equal(JSON.parse(run.stdout.trim()).result.serverInfo.version,'1.3.2');
      } else {
        assert.notEqual(run.status,0);
        assert.equal(run.stdout,'');
        assert.match(run.stderr,/Plugin integrity verification failed/);
      }
    } finally {
      await rm(temp,{recursive:true,force:true});
    }
  });
}
