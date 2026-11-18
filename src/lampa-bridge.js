(() => {
  const params = new URLSearchParams(location.search);
  const session = params.get('session');
  let origin;
  let connected = false;
  let retry;
  // Opaque file:// hosts require '*'; incoming messages still require the exact
  // parent window, opaque origin and per-launch session. No credentials are sent.
  const send = (type, extra = {}) => window.parent.postMessage({channel:'movie-kombat-v1',session,type,...extra},origin==='null'?'*':origin);
  window.MovieKombatHost = {
    watch(id) {
      if (!connected || !Number.isSafeInteger(Number(id)) || Number(id)<=0) return false;
      send('watch',{tmdbId:Number(id)}); return true;
    },
    close() { if (!connected) return false; send('close'); return true; }
  };
  if (params.get('host') !== 'lampa' || window.parent === window || !session) return;
  try {
    const parentOrigin=params.get('parentOrigin');
    if(parentOrigin==='null') origin='null';
    else {
      const url=new URL(parentOrigin);
      if (!['http:','https:','chrome-extension:'].includes(url.protocol)) return;
      origin=url.protocol==='chrome-extension:' ? url.protocol+'//'+url.host : url.origin;
    }
  } catch (_) { return; }
  window.addEventListener('message', event => {
    const data=event.data;
    if (event.source!==window.parent || event.origin!==origin || !data || data.channel!=='movie-kombat-v1' || data.session!==session) return;
    if (data.type==='connected') { connected=true; clearInterval(retry); }
    if (connected && data.type==='key' && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape'].includes(data.key)) {
      const target=document.activeElement || document;
      const event=new KeyboardEvent('keydown',{key:data.key,bubbles:true,cancelable:true});
      const allowed=target.dispatchEvent(event);
      // Synthetic Enter has no browser default click action.
      if (allowed && data.key==='Enter' && target.tagName==='BUTTON') target.click();
    }
  });
  send('ready');
  retry=setInterval(()=>{if(!connected)send('ready');},1000);
  setTimeout(()=>clearInterval(retry),20000);
})();
