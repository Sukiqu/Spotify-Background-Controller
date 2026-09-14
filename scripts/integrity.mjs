import {verify} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, '.codex-plugin', 'plugin.json');
const signaturePath = path.join(root, '.codex-plugin', 'plugin.json.sig');
const publicKeyPath = path.join(root, '.codex-plugin', 'public-key.pem');

export async function verifyIntegrity() {
  let manifest, signature, publicKey;
  try {
    manifest = await readFile(manifestPath);
    signature = Buffer.from((await readFile(signaturePath, 'utf8')).trim(), 'base64');
    publicKey = await readFile(publicKeyPath, 'utf8');
  } catch {
    throw new Error('Plugin integrity verification failed: the signed manifest is missing.');
  }
  let valid = false;
  try { valid = verifyManifest(manifest, signature, publicKey); } catch {}
  if (!valid) {
    throw new Error('Plugin integrity verification failed: plugin.json was modified or corrupted.');
  }
  return true;
}

export function verifyManifest(manifest, signature, publicKey) {
  return verify(null, manifest, publicKey, signature);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await verifyIntegrity(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
