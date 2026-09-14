import test from 'node:test';
import assert from 'node:assert/strict';
import {Spotify, SCOPES} from '../scripts/core.mjs';
import {TOOLS, validateArgs} from '../scripts/server.mjs';

const uri = 'spotify:track:AAAAAAAAAAAAAAAAAAAAAA';
const pc = {id:'pc-id', name:'My PC', is_restricted:false};
function fixture({devices=[pc], enqueue=async()=>new Response(null,{status:204})}={}) {
  const calls=[];
  let refreshes=0;
  const spotify=new Spotify({getToken:async()=> 'mock-token', refreshToken:async()=>{refreshes++;},
    fetcher:async(url, init)=>{
      const parsed=new URL(url);
      calls.push({path:parsed.pathname, params:parsed.searchParams, ...init});
      if(parsed.pathname==='/v1/me/player/devices') return Response.json({devices});
      assert.equal(parsed.pathname,'/v1/me/player/queue','No playback interruption endpoint may be called');
      return enqueue();
    }});
  return {spotify,calls,get refreshes(){return refreshes;}};
}
test('queue targets exact device once and never starts or skips playback',async()=>{
  const f=fixture();
  const result=await f.spotify.addToQueue('https://open.spotify.com/track/AAAAAAAAAAAAAAAAAAAAAA','My PC');
  assert.equal(result.accepted,true);
  assert.equal(result.verified,false);
  assert.equal(f.calls.length,2);
  assert.equal(f.calls[1].method,'POST');
  assert.equal(f.calls[1].params.get('uri'),uri);
  assert.equal(f.calls[1].params.get('device_id'),'pc-id');
  assert.equal(f.calls[1].body,undefined);
});
test('invalid track is rejected before any network request',async()=>{
  const f=fixture();
  await assert.rejects(f.spotify.addToQueue('Monster','My PC'),/valid Spotify track/);
  assert.equal(f.calls.length,0);
});
test('successful queue acknowledgements need no JSON body',async()=>{
  for(const body of ['', ' ', 'OK', '{invalid']){
    const f=fixture({enqueue:async()=>new Response(body,{status:200})});
    assert.equal((await f.spotify.addToQueue(uri,'My PC')).accepted,true);
    assert.equal(f.calls.length,2);
  }
});
test('JSON read errors remain errors on data endpoints',async()=>{
  const spotify=new Spotify({getToken:async()=> 'mock', refreshToken:async()=>{},
    fetcher:async()=>new Response('invalid',{status:200})});
  await assert.rejects(spotify.devices(),SyntaxError);
});
test('missing, ambiguous and restricted devices cannot receive a queue mutation',async()=>{
  for(const devices of [[],[pc,pc],[{...pc,is_restricted:true}]]){
    const f=fixture({devices});
    await assert.rejects(f.spotify.addToQueue(uri,'My PC'),/unavailable|ambiguous/);
    assert.equal(f.calls.length,1);
  }
});
test('network errors and timeouts never cause duplicate queue submissions',async()=>{
  for(const error of [new DOMException('timeout','TimeoutError'),new TypeError('fetch failed')]){
    const f=fixture({enqueue:async()=>{throw error;}});
    await assert.rejects(f.spotify.addToQueue(uri,'My PC'),/outcome is unknown.*Do not automatically retry/);
    assert.equal(f.calls.length,2);
  }
});
test('rate limits and rejected commands are not reported as success or retried',async()=>{
  for(const status of [403,404,429,500]){
    const f=fixture({enqueue:async()=>new Response(null,{status})});
    await assert.rejects(f.spotify.addToQueue(uri,'My PC'));
    assert.equal(f.calls.length,2);
  }
});
test('401 refresh retries only the rejected request',async()=>{
  let attempts=0;
  const f=fixture({enqueue:async()=>new Response(null,{status:++attempts===1?401:200})});
  assert.equal((await f.spotify.addToQueue(uri,'My PC')).accepted,true);
  assert.equal(f.refreshes,1);
  assert.equal(attempts,2);
});
test('MCP tool requires exact track and device, and uses existing permission',()=>{
  const tool=TOOLS.find(t=>t.name==='add_to_queue');
  assert.ok(tool);
  assert.equal(tool.annotations.readOnlyHint,false);
  assert.throws(()=>validateArgs('add_to_queue',{track:uri}),/device_name/);
  validateArgs('add_to_queue',{track:uri,device_name:'My PC'});
  assert.ok(SCOPES.split(' ').includes('user-modify-playback-state'));
  assert.match(TOOLS.find(t=>t.name==='search').description,/add_to_queue for a queue request/);
});
