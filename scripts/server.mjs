import path from 'node:path';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline';
import {Spotify} from './core.mjs';
import {Vault} from './vault.mjs';
import {Auth} from './auth.mjs';
import {verifyIntegrity} from './integrity.mjs';

const str={type:'string'};
const define=(name,description,properties={},required=[],readOnly=true)=>({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:readOnly,destructiveHint:false,openWorldHint:true}});
export const TOOLS=[
  define('connection_status','Read connection status. No tokens are returned.'),
  define('connect','Begin one-time Spotify PKCE authorization. Never access or request access to the Spotify Developer Dashboard, and never ask for a dashboard login. The fixed Redirect URI is http://127.0.0.1:43821/callback. The first authorization also requests private playlist read access; do not ask the user to provide a different Redirect URI or take over a Spotify tab. Returns a link for the user and does not open or focus any window. Uses the configured Client ID when client_id is omitted. Client ID is public; never request a Client Secret or Spotify password.',{client_id:str},[],false),
  define('devices','List available Spotify devices. Pick the exact Windows computer name; never silently choose a phone or speaker.'),
  define('playlists','List playlists saved in the user Spotify library. Beğenilen Şarkılar is not returned by this tool; use play_liked_songs for that library.'),
  define('play_liked_songs','Start the user’s Spotify Beğenilen Şarkılar / Liked Songs library on the explicitly named computer. Use when the user says "beğenilen şarkılar", "liked songs", "beğenilenleri aç", "kitaplığımdan beğenilenleri oynat" or equivalent. Only say it is playing when the first track and device are verified.',{device_name:str},['device_name'],false),
  define('search','Find Spotify tracks by title and artist. Returns exact URIs and official links. If the current user message gives only a title, present the candidates and ask which artist they mean; never reuse an artist or URI from an earlier turn and never choose the first result silently. After the user chooses, preserve their requested action: call add_to_queue for a queue request, or play for a playback request.',{query:str},['query']),
  define('add_to_queue','Add one selected song to the Spotify playback queue on the explicitly named computer without interrupting the current song. Understand "sıraya ekle", "kuyruğa ekle", "çalma sırasına ekle" and "add to queue". Use an exact track URI or official Spotify track link supplied by the user or returned by search. Resolve ambiguous titles with the user before calling this tool; never silently reuse an earlier artist. For queue requests use this tool, not play, resume or next. Call once per requested addition. On accepted:true report that Spotify accepted the queue request; do not claim an exact queue position or verified playback. Never automatically retry an unknown outcome because that may add duplicates.',{track:str,device_name:str},['track','device_name'],false),
  define('play','Play a Spotify track on the explicitly named computer using Spotify Connect, without any mouse, keyboard or focus changes. Use a URI returned by search or supplied by the user. Require an unambiguous artist/title or exact URI from the current user message; if the current message contains only a title, do not reuse prior conversation context, ask the user to choose an artist before calling play. This tool directly starts playback; it is not a link-only action. Do not claim you cannot press Spotify play button when this tool is available. Only say playing when verified is true.',{track:str,device_name:str},['track','device_name'],false),
  define('play_playlist','Start an exact playlist from the user Spotify library on the explicitly named computer. Understand Turkish requests such as "kitaplığımdan ... playlistini aç", "... çalma listesini aç", "başlat" or "oynat". Only say it is playing when the playlist context and device are verified.',{playlist_name:str,device_name:str},['playlist_name','device_name'],false),
  define('playback_state','Read current playback and device to verify an action.'),
  define('control','Pause, resume, skip, or change volume on an explicitly named Spotify device. Only perform the action requested by the user.',{action:{type:'string',enum:['pause','resume','next','previous','volume']},device_name:str,volume:{type:'integer',minimum:0,maximum:100}},['action','device_name'],false)
];

export function validateArgs(name,args){
  const tool=TOOLS.find(t=>t.name===name);if(!tool)throw new Error('Unknown tool.');
  if(!args||typeof args!=='object'||Array.isArray(args))throw new Error('Arguments must be an object.');
  for(const k of Object.keys(args))if(!Object.hasOwn(tool.inputSchema.properties,k))throw new Error('Unexpected argument.');
  for(const k of tool.inputSchema.required)if(!Object.hasOwn(args,k))throw new Error('Missing '+k+'.');
  for(const [k,v] of Object.entries(args)){
    const p=tool.inputSchema.properties[k];
    if(p.type==='string'&&(typeof v!=='string'||!v.trim()||v.length>2000))throw new Error('Invalid '+k+'.');
    if(p.enum&&!p.enum.includes(v))throw new Error('Invalid '+k+'.');
    if(p.type==='integer'&&(!Number.isInteger(v)||v<p.minimum||v>p.maximum))throw new Error('Invalid '+k+'.');
  }
}

export async function main(){
  await verifyIntegrity();
  const defaultDataRoot=process.env.LOCALAPPDATA || process.env.XDG_DATA_HOME || (process.env.HOME ? path.join(process.env.HOME,'.local','share') : process.cwd());
  const base=process.env.SPOTIFY_BACKGROUND_DATA_DIR || path.join(defaultDataRoot,'SpotifyBackground');
  const auth=new Auth(new Vault(base));
  try { await auth.load(); } catch { auth.phase='secure_storage_unavailable'; }
  const spotify=new Spotify({getToken:()=>auth.token(),refreshToken:()=>auth.refresh()});
  const call=async(name,args)=>{
    validateArgs(name,args);
    switch(name){
      case 'connection_status':return {status:auth.phase,connected:!!auth.tokens};
      case 'connect':return auth.begin(args.client_id || process.env.SPOTIFY_CLIENT_ID);
      case 'devices':return spotify.devices();
      case 'playlists':return spotify.playlists();
      case 'play_liked_songs':return spotify.playLikedSongs(args.device_name);
      case 'search':return spotify.search(args.query);
      case 'add_to_queue':return spotify.addToQueue(args.track,args.device_name);
      case 'play':return spotify.play(args.track,args.device_name);
      case 'play_playlist':return spotify.playPlaylist(args.playlist_name,args.device_name);
      case 'playback_state':return spotify.state();
      case 'control':return spotify.control(args.action,args.device_name,args.volume);
    }
  };
  const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
  async function handle(line){
    let req;try{req=JSON.parse(line);}catch{send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}});return;}
    if(!req||req.jsonrpc!=='2.0'||typeof req.method!=='string'){send({jsonrpc:'2.0',id:req?.id??null,error:{code:-32600,message:'Invalid request'}});return;}
    if(req.id===undefined)return;
    const reply=result=>send({jsonrpc:'2.0',id:req.id,result});
    if(req.method==='initialize'){
      const supported=['2024-11-05','2025-03-26','2025-06-18'];
      reply({protocolVersion:supported.includes(req.params?.protocolVersion)?req.params.protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'spotify-background',version:'1.3.2'}});
    }else if(req.method==='ping')reply({});
    else if(req.method==='tools/list')reply({tools:TOOLS});
    else if(req.method==='tools/call'){
      try{reply({content:[{type:'text',text:JSON.stringify(await call(req.params?.name,req.params?.arguments||{}))}]});}
      catch(e){reply({isError:true,content:[{type:'text',text:e.name==='TimeoutError'?'Spotify request timed out. Its outcome is unknown; check playback before retrying.':e.message}]});}
    }else send({jsonrpc:'2.0',id:req.id,error:{code:-32601,message:'Method not found'}});
  }
  const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
  let chain=Promise.resolve();
  input.on('line',line=>{if(line.length>65536){send({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Request too large'}});return;}chain=chain.then(()=>handle(line)).catch(()=>{process.stderr.write('Request processing failed.\n');});});
  input.on('close',()=>{chain.finally(()=>auth.close());});
  process.on('SIGTERM',()=>{auth.close();process.exit(0);});
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();



