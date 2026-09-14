import {spawn} from 'node:child_process';
import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';

function protect(input, decrypt = false) {
  if (process.platform !== 'win32') throw new Error('Secure token storage currently supports Windows only.');
  const operation = decrypt
    ? '$bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $plain=[Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Text.Encoding]::UTF8.GetString($plain))'
    : '$bytes=[Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd()); $cipher=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($cipher))';
  const script = '$ErrorActionPreference="Stop"; [void][Reflection.Assembly]::LoadWithPartialName("System.Security"); try { ' + operation + ' } catch { [Console]::Error.Write($_.Exception.ToString()); exit 1 }';
  return new Promise((resolve,reject)=>{
    const exe = path.join(process.env.SystemRoot || 'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
    const child=spawn(exe,['-NoLogo','-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    let output='', diagnostic=''; const timer=setTimeout(()=>child.kill(),15000);
    child.stdout.setEncoding('utf8'); child.stdout.on('data',d=>output+=d);
    child.stderr.setEncoding('utf8'); child.stderr.on('data',d=>{diagnostic=(diagnostic+d).slice(-4000);}); child.stdin.on('error',()=>{});
    child.on('error',()=>{clearTimeout(timer);reject(new Error('Windows secure token storage is unavailable.'));});
    child.on('close',code=>{
      clearTimeout(timer);
      if(code===0){resolve(output.trim());return;}
      const profileMissing=diagnostic.includes('Cryptography_DpApi_ProfileMayNotBeLoaded');
      const error=new Error(profileMissing?'Windows secure storage needs a loaded user profile. Run the plugin under your normal Windows account; tokens were not saved in plaintext.':'Windows could not protect or decrypt the Spotify token.');
      error.code=profileMissing?'DPAPI_PROFILE_UNAVAILABLE':'DPAPI_FAILED'; reject(error);
    });
    child.stdin.end(input);
  });
}

export class Vault {
  constructor(directory) { this.directory=directory; this.file=path.join(directory,'tokens.dpapi'); }
  async load() {
    let encrypted;
    try { encrypted=await readFile(this.file,'utf8'); } catch(e) { if(e.code==='ENOENT') return null; throw e; }
    return JSON.parse(await protect(encrypted,true));
  }
  async save(tokens) {
    const encrypted=await protect(JSON.stringify(tokens));
    await mkdir(this.directory,{recursive:true});
    const temp=this.file+'.'+randomBytes(8).toString('hex')+'.tmp';
    await writeFile(temp,encrypted,{mode:0o600});
    await rename(temp,this.file);
  }
}

