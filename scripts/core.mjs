import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';

export const SCOPES = 'user-read-playback-state user-modify-playback-state user-library-read playlist-read-private playlist-read-collaborative';
export const REDIRECT = 'http://127.0.0.1:43821/callback';

export function pkce() {
  const verifier = randomBytes(48).toString('base64url');
  return {verifier, challenge: createHash('sha256').update(verifier).digest('base64url'), state: randomBytes(32).toString('base64url')};
}

export function validState(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function trackUri(value) {
  if (typeof value !== 'string') throw new Error('A Spotify track URI or link is required.');
  if (/^spotify:track:[A-Za-z0-9]{22}$/.test(value)) return value;
  try {
    const u = new URL(value);
    const match = u.pathname.match(/^\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})\/?$/);
    if (u.protocol === 'https:' && u.hostname === 'open.spotify.com' && !u.port && !u.username && !u.password && match) return 'spotify:track:' + match[1];
  } catch {}
  throw new Error('Only a valid Spotify track URI or official HTTPS track link is accepted.');
}

export function playlistUri(value) {
  if (typeof value !== 'string') throw new Error('A Spotify playlist URI or link is required.');
  if (/^spotify:playlist:[A-Za-z0-9]{22}$/.test(value)) return value;
  try {
    const u = new URL(value);
    const match = u.pathname.match(/^\/(?:intl-[a-z-]+\/)?playlist\/([A-Za-z0-9]{22})\/?$/);
    if (u.protocol === 'https:' && u.hostname === 'open.spotify.com' && !u.port && !u.username && !u.password && match) return 'spotify:playlist:' + match[1];
  } catch {}
  throw new Error('Only a valid Spotify playlist URI or official HTTPS playlist link is accepted.');
}

export function chooseDevice(devices, name) {
  const usable = devices.filter(d => d.id && !d.is_restricted);
  if (!name) throw new Error('Choose a device by its exact name from devices before controlling playback.');
  const matches = usable.filter(d => d.name === name);
  if (matches.length !== 1) throw new Error(matches.length ? 'Device name is ambiguous; rename one device in Spotify.' : 'Selected device is unavailable. Open Spotify on that computer, then list devices again.');
  return matches[0];
}

export class Spotify {
  constructor({getToken, refreshToken, fetcher = fetch, sleep = ms => new Promise(r => setTimeout(r, ms))}) {
    this.getToken = getToken; this.refreshToken = refreshToken; this.fetcher = fetcher; this.sleep = sleep;
  }

  async request(path, {method = 'GET', body, expectJson = true} = {}, retry = true) {
    if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid API path.');
    const token = await this.getToken();
    const response = await this.fetcher('https://api.spotify.com/v1' + path, {
      method, headers: {Authorization: 'Bearer ' + token, ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(15000), redirect: 'error'
    });
    if (response.status === 401 && retry) { await this.refreshToken(); return this.request(path, {method, body, expectJson}, false); }
    if (response.status === 429) throw new Error('Spotify rate limit. Retry after ' + (response.headers.get('retry-after') || 'a few') + ' seconds; the command was not retried.');
    if (response.status === 403) throw new Error('Spotify denied access. Check Premium, library and playlist permissions, approved user list and playback permissions. If library or playlists were added after the first connection, reconnect once.');
    if (response.status === 404) throw new Error('Spotify device or content is unavailable. Refresh devices; no other device was selected.');
    if (!response.ok) throw new Error('Spotify request failed (HTTP ' + response.status + '). Playback was not confirmed.');
    // Queue commands acknowledge receipt; their success body need not be JSON.
    if (response.status === 204 || !expectJson) return null;
    return response.json();
  }

  async devices() { return (await this.request('/me/player/devices')).devices || []; }

  async search(query) {
    if (typeof query !== 'string' || !query.trim() || query.length > 300) throw new Error('Search query must contain 1–300 characters.');
    const result = await this.request('/search?' + new URLSearchParams({q: query, type: 'track', limit: '5'}));
    return (result.tracks?.items || []).filter(Boolean).map(t => ({name:t.name, artists:t.artists?.map(a=>a.name), uri:t.uri, url:t.external_urls?.spotify}));
  }

  async playlists() {
    const items = [];
    for (let offset = 0; ; offset += 50) {
      const result = await this.request('/me/playlists?' + new URLSearchParams({limit:'50', offset:String(offset)}));
      const page = (result.items || []).filter(p => p && p.id && p.name).map(p => ({name:p.name, uri:p.uri, url:p.external_urls?.spotify, owner:p.owner?.display_name || p.owner?.id}));
      items.push(...page);
      if (!result.next || page.length === 0 || items.length >= 1000) break;
    }
    return items;
  }

  async likedTracks() {
    const items = [];
    for (let offset = 0; ; offset += 50) {
      const result = await this.request('/me/tracks?' + new URLSearchParams({limit:'50', offset:String(offset)}));
      const page = (result.items || []).filter(x => x?.track?.uri).map(x => ({
        name:x.track.name,
        artists:x.track.artists?.map(a=>a.name),
        uri:x.track.uri,
        url:x.track.external_urls?.spotify
      }));
      items.push(...page);
      if (!result.next || page.length === 0 || items.length >= 100) break;
    }
    return items.slice(0, 100);
  }

  async state() {
    const s = await this.request('/me/player');
    return s ? {is_playing:s.is_playing, device:s.device && {id:s.device.id,name:s.device.name}, context:s.context && {uri:s.context.uri}, track:s.item && {name:s.item.name, uri:s.item.uri, artists:s.item.artists?.map(a=>a.name), url:s.item.external_urls?.spotify}, progress_ms:s.progress_ms} : null;
  }

  async playPlaylist(playlistName, deviceName) {
    if (typeof playlistName !== 'string' || !playlistName.trim() || playlistName.length > 300) throw new Error('Playlist name must contain 1–300 characters.');
    const requested = playlistName.trim();
    const all = await this.playlists();
    let matches;
    try {
      const uri = playlistUri(requested);
      matches = all.filter(p => p.uri === uri);
    } catch {
      const key = requested.normalize('NFKC').toLowerCase();
      matches = all.filter(p => p.name.normalize('NFKC').trim().toLowerCase() === key);
    }
    if (matches.length === 0) throw new Error('No exact playlist with that name was found in your Spotify library. Use playlists to see the available names.');
    if (matches.length > 1) throw new Error('More than one playlist has that name. Choose one exact playlist.');
    const playlist = matches[0];
    const device = chooseDevice(await this.devices(), deviceName);
    await this.request('/me/player/play?' + new URLSearchParams({device_id:device.id}), {method:'PUT', body:{context_uri:playlist.uri}});
    for (let i=0; i<4; i++) {
      await this.sleep(500);
      const state = await this.state();
      if (state?.is_playing && state.device?.id === device.id && state.context?.uri === playlist.uri) return {verified:true, playlist, ...state};
    }
    return {verified:false, accepted:true, playlist, message:'Spotify accepted the playlist command, but playback on the selected device has not been confirmed. Do not claim it is playing.'};
  }

  async playLikedSongs(deviceName) {
    const liked = await this.likedTracks();
    if (!liked.length) throw new Error('No liked songs were found in your Spotify library.');
    const device = chooseDevice(await this.devices(), deviceName);
    await this.request('/me/player/play?' + new URLSearchParams({device_id:device.id}), {method:'PUT', body:{uris:liked.map(t=>t.uri)}});
    for (let i=0; i<4; i++) {
      await this.sleep(500);
      const state = await this.state();
      if (state?.is_playing && state.device?.id === device.id && state.track?.uri === liked[0].uri) return {verified:true, source:'liked_songs', queued_count:liked.length, first_track:liked[0], ...state};
    }
    return {verified:false, accepted:true, source:'liked_songs', queued_count:liked.length, first_track:liked[0], message:'Spotify accepted the liked-songs command, but playback on the selected device has not been confirmed. Do not claim it is playing.'};
  }

  async play(track, deviceName) {
    const uri = trackUri(track);
    const device = chooseDevice(await this.devices(), deviceName);
    await this.request('/me/player/play?' + new URLSearchParams({device_id:device.id}), {method:'PUT', body:{uris:[uri]}});
    for (let i=0; i<4; i++) {
      await this.sleep(500);
      const state = await this.state();
      if (state?.is_playing && state.device?.id === device.id && state.track?.uri === uri) return {verified:true, ...state};
    }
    return {verified:false, accepted:true, message:'Spotify accepted the command, but playback of this exact track on the selected device has not been confirmed. Do not claim it is playing.'};
  }

  async addToQueue(track, deviceName) {
    const uri = trackUri(track);
    const device = chooseDevice(await this.devices(), deviceName);
    const params = new URLSearchParams({uri, device_id:device.id});
    try {
      await this.request('/me/player/queue?' + params, {method:'POST', expectJson:false});
    } catch (error) {
      if (['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)) {
        throw new Error('The queue request outcome is unknown after a network error or timeout. Do not automatically retry: the track may already have been added. Check the Spotify queue first.');
      }
      throw error;
    }
    return {accepted:true, verified:false, action:'add_to_queue', track_uri:uri,
      device:{id:device.id, name:device.name},
      message:'Spotify accepted the request to add this track to the queue. Queue contents and position were not independently verified. Do not repeat the request or claim playback has started.'};
  }

  async control(action, deviceName, volume) {
    if (!['pause','resume','next','previous','volume'].includes(action)) throw new Error('Unknown playback action.');
    if (action === 'volume' && (!Number.isInteger(volume) || volume < 0 || volume > 100)) throw new Error('Volume must be an integer from 0 to 100.');
    const device = chooseDevice(await this.devices(), deviceName);
    const params = new URLSearchParams({device_id:device.id});
    if (action === 'volume') params.set('volume_percent', String(volume));
    const endpoint = action === 'resume' ? 'play' : action;
    await this.request('/me/player/' + endpoint + '?' + params, {method:['next','previous'].includes(action) ? 'POST' : 'PUT'});
    return {accepted:true, verified:false, message:'Spotify accepted the control command. This is an acknowledgement, not playback verification.'};
  }
}

