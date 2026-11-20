// Blob storage works independently of Service Workers (including HTTP-hosted Lampa).
(() => {
  const files=[...new Set([...(window.MK_ART || []),'src/ui/movie-kombat-tickets.png'])];
  const base=new URL('./',location.href);
  const allowed=new Set(files.map(file=>new URL(file,base).href));
  const blobs=new Map(),saved=new Set(),jobs=new Map(),nativeImages=new Map();
  let db=null,storage='checking',active=0;
  const queue=[];
  let motion=false;const pendingArtwork=new Map();
  const canonical=value=>new URL(value,base).href;
  const notify=()=>window.dispatchEvent(new Event('mk-assets'));
  function apply(url,blob){
    if(blobs.has(url))return blobs.get(url);
    const local=URL.createObjectURL(blob);blobs.set(url,local);
    if(motion){pendingArtwork.set(url,local);return local;}
    updateArtwork(url,local);return local;
  }
  function updateArtwork(url,local){
    const name=new URL(url).pathname.split('/').pop().split('.')[0];
    document.documentElement.style.setProperty('--mk-art-'+name,'url("'+local+'")');
    document.querySelectorAll('img').forEach(img=>{if(img.src===url){img.src=local;img.hidden=false;}});
    return local;
  }
  function open(){
    return new Promise(resolve=>{
      let settled=false;
      const finish=value=>{if(!settled){clearTimeout(timeout);settled=true;resolve(value);}};
      const timeout=setTimeout(()=>{storage='blocked';finish(null);},1800);
      try {
        const request=indexedDB.open('movie-kombat-art',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('images',{keyPath:'url'});
        request.onerror=request.onblocked=()=>{clearTimeout(timeout);storage='blocked';finish(null);};
        request.onsuccess=()=>{
          if(settled){request.result.close();return;}
          db=request.result;db.onversionchange=()=>db.close();
          const tx=db.transaction('images','readonly');const all=tx.objectStore('images').getAll();
          all.onsuccess=()=>{
            for(const item of all.result)if(allowed.has(item.url)&&item.blob instanceof Blob){apply(item.url,item.blob);saved.add(item.url);}
          };
          tx.oncomplete=()=>{storage='available';finish(db);};
          tx.onerror=tx.onabort=()=>{storage='blocked';finish(null);};
        };
      }catch(_){clearTimeout(timeout);storage='blocked';finish(null);}
    });
  }
  function persist(url,blob){
    if(!db)return Promise.resolve(false);
    return new Promise(resolve=>{
      let settled=false;
      const finish=value=>{if(!settled){settled=true;clearTimeout(timer);resolve(value);}};
      const timer=setTimeout(()=>{storage='blocked';finish(false);},5000);
      try {
        const tx=db.transaction('images','readwrite');tx.objectStore('images').put({url,blob});
        tx.oncomplete=()=>{saved.add(url);finish(true);notify();};
        tx.onerror=tx.onabort=()=>{storage='full';finish(false);};
      }catch(_){storage='blocked';finish(false);}
    });
  }
  function pump(){
    while(!motion&&active<2&&queue.length){
      const job=queue.shift();active++;
      job().finally(()=>{active--;pump();});
    }
  }
  function readBytes(blob){
    if(typeof blob.arrayBuffer==='function')return blob.arrayBuffer();
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||Error('Image read failed'));reader.readAsArrayBuffer(blob);
    });
  }
  // Image loading also works where fetch is blocked (for example file:// TV hosts).
  function loadNative(url){
    if(typeof Image!=='function')return Promise.reject(Error('Image loader unavailable'));
    return new Promise((resolve,reject)=>{
      const image=new Image();
      const timer=setTimeout(()=>{image.onload=image.onerror=null;reject(Error('Image request timed out'));},15000);
      image.onload=()=>{clearTimeout(timer);image.onload=image.onerror=null;nativeImages.set(url,image);resolve(url);};
      image.onerror=()=>{clearTimeout(timer);image.onload=image.onerror=null;reject(Error('Image unavailable: '+new URL(url).pathname.split('/').pop()));};
      image.src=url;
    });
  }
  function ensure(value){
    const url=canonical(value);
    if(!allowed.has(url))return Promise.reject(Error('Unknown artwork'));
    if(blobs.has(url))return Promise.resolve(blobs.get(url));
    if(nativeImages.has(url))return Promise.resolve(url);
    if(jobs.has(url))return jobs.get(url);
    const promise=new Promise((resolve,reject)=>{
      queue.push(async()=>{
        let error;
        for(let attempt=0;attempt<2;attempt++){
          const controller=typeof AbortController==='function'?new AbortController():null;let timer;
          try {
            const response=await Promise.race([fetch(url,controller?{signal:controller.signal}:{}),new Promise((_,reject)=>{timer=setTimeout(()=>{if(controller)controller.abort();reject(Error('Image request timed out'));},15000);})]);
            if(!response.ok)throw Error('HTTP '+response.status);
            const blob=await response.blob();
            const signature=new Uint8Array(await readBytes(blob.slice(0,12)));
            const webp=String.fromCharCode(...signature.slice(8,12))==='WEBP';
            const png=signature[0]===137&&String.fromCharCode(...signature.slice(1,4))==='PNG';
            if(!webp&&!png)throw Error('Invalid image');
            clearTimeout(timer);const local=apply(url,blob);await persist(url,blob);notify();resolve(local);return;
          }catch(e){error=e;}finally{clearTimeout(timer);}
        }
        try{resolve(await loadNative(url));}catch(nativeError){reject(typeof Image==='function'?nativeError:error);}
      });pump();
    });
    jobs.set(url,promise);promise.then(()=>jobs.delete(url),()=>jobs.delete(url));return promise;
  }
  const ready=open().then(()=>{notify();});
  const api={ready,setMotion(value){motion=value;if(!motion){pendingArtwork.forEach((local,url)=>updateArtwork(url,local));pendingArtwork.clear();pump();}},url:value=>blobs.get(canonical(value)) || value,ensure,
    files:files.slice(),status:()=>({total:files.length,saved:saved.size,storage})
  };
  window.MovieKombatAssets=api;
})();
