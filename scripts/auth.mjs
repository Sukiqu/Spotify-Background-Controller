import http from 'node:http';
import {pkce, validState, SCOPES, REDIRECT} from './core.mjs';

export class Auth {
  constructor(vault) { this.vault=vault; this.tokens=null; this.server=null; this.phase='not_connected'; this.refreshPromise=null; }
  async load() { this.tokens=await this.vault.load(); if(this.tokens)this.phase='connected'; }
  async exchange(params) {
    const response=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),signal:AbortSignal.timeout(15000),redirect:'error'});
    if(!response.ok) throw new Error('Spotify authorization failed. Reconnect and check the app configuration.');
    const t=await response.json();
    if(!t.access_token || !Number.isFinite(t.expires_in)) throw new Error('Spotify returned an invalid authorization response.');
    return t;
  }
  async refresh() {
    if(this.refreshPromise)return this.refreshPromise;
    this.refreshPromise=(async()=>{
      if(!this.tokens?.refresh_token)throw new Error('Spotify connection required. Use connect first.');
      const old=this.tokens;
      const t=await this.exchange({grant_type:'refresh_token',refresh_token:old.refresh_token,client_id:old.client_id});
      const next={...old,...t,expires_at:Date.now()+t.expires_in*1000};
      await this.vault.save(next);this.tokens=next;
    })();
    try { await this.refreshPromise; } finally { this.refreshPromise=null; }
  }
  async token() {
    if(!this.tokens)throw new Error('Spotify is not connected. A developer Client ID and one-time user authorization are required.');
    if(this.tokens.expires_at<Date.now()+60000)await this.refresh();
    return this.tokens.access_token;
  }
  async begin(clientId) {
    if(typeof clientId!=='string'|| !/^[a-fA-F0-9]{32}$/.test(clientId))throw new Error('A valid Spotify developer Client ID is required. It is public; never provide a Client Secret.');
    if(this.server)throw new Error('An authorization is already pending. Finish it or wait for it to expire.');
    const p=pkce();let used=false;this.phase='waiting';
    const server=http.createServer(async(req,res)=>{
      res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
      if(req.method!=='GET'||req.headers.host!=='127.0.0.1:43821'){res.writeHead(400);res.end('Invalid request.');return;}
      const u=new URL(req.url,REDIRECT);
      if(u.pathname!=='/callback'){res.writeHead(404);res.end('Not found.');return;}
      if(used||!validState(u.searchParams.get('state'),p.state)){res.writeHead(400);res.end('Invalid or expired authorization state.');return;}
      used=true;
      try {
        if(u.searchParams.has('error')||!u.searchParams.get('code'))throw new Error('Authorization declined.');
        const t=await this.exchange({client_id:clientId,grant_type:'authorization_code',code:u.searchParams.get('code'),redirect_uri:REDIRECT,code_verifier:p.verifier});
        if(!t.refresh_token)throw new Error('No refresh token returned.');
        if(!SCOPES.split(' ').every(s=>(t.scope||'').split(' ').includes(s)))throw new Error('Required Spotify playback, playlist, or library permission was not granted. Reconnect and approve all requested permissions.');
        const next={...t,client_id:clientId,expires_at:Date.now()+t.expires_in*1000};
        await this.vault.save(next);this.tokens=next;this.phase='connected';
        res.end('Spotify connected. You can close this tab and return to your task.');
      }catch{this.phase='authorization_failed';res.writeHead(400);res.end('Connection failed. Start a new connection from the controller and try again.');}
      finally { this.close(); }
    });
    this.server=server;
    try { await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(43821,'127.0.0.1',resolve);}); }
    catch { this.server=null; this.phase='callback_unavailable'; throw new Error('Local callback port is busy or unavailable. No authorization was started.'); }
    this.timer=setTimeout(()=>{this.phase='authorization_expired';this.close();},5*60*1000); this.timer.unref();
    const query=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:REDIRECT,scope:SCOPES,state:p.state,code_challenge_method:'S256',code_challenge:p.challenge});
    return {authorization_url:'https://accounts.spotify.com/authorize?'+query,expires_in_seconds:300,redirect_uri:REDIRECT,message:'Open this link once to grant playback access. No browser was opened automatically.'};
  }
  close(){clearTimeout(this.timer);this.server?.close();this.server=null;}
}

