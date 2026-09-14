import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {verifyIntegrity, verifyManifest} from '../scripts/integrity.mjs';

test('signed manifest is accepted', async () => {
  await assert.doesNotReject(verifyIntegrity());
});

test('manifest changes are rejected', async () => {
  const manifest = await readFile(new URL('../.codex-plugin/plugin.json', import.meta.url));
  const signature = Buffer.from((await readFile(new URL('../.codex-plugin/plugin.json.sig', import.meta.url), 'utf8')).trim(), 'base64');
  const publicKey = await readFile(new URL('../.codex-plugin/public-key.pem', import.meta.url), 'utf8');
  const tampered = Buffer.from(`${manifest.toString()}\n`);
  assert.equal(verifyManifest(tampered, signature, publicKey), false);
});
