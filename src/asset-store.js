// Blob storage works independently of Service Workers (including HTTP-hosted Lampa).
(() => {
  const files=window.MK_ART || [];
  const base=new URL('./',location.href);
  const allowed=new Set(files.map(file=>new URL(file,base).href));
  const blobs=new Map(),saved=new Set(),jobs=new Map();
  let db=null,busy=false,done=0,failed=0,storage='checking',active=0;
  const queue=[];
  const canonical=value=>new URL(value,base).href;
  const notify=()=>window.dispatchEvent(new Event('mk-assets'));
  function apply(url,blob){
    if(blobs.has(url))return blobs.get(url);
    const local=URL.createObjectURL(blob);blobs.set(url,local);
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
      try {
        const tx=db.transaction('images','readwrite');tx.objectStore('images').put({url,blob});
        tx.oncomplete=()=>{saved.add(url);resolve(true);};
        tx.onerror=tx.onabort=()=>{storage='full';resolve(false);};
      }catch(_){storage='blocked';resolve(false);}
    });
  }
  function pump(){
    while(active<3&&queue.length){
      const job=queue.shift();active++;
      job().finally(()=>{active--;pump();});
    }
  }
  function ensure(value){
    const url=canonical(value);
    if(!allowed.has(url))return Promise.reject(Error('Unknown artwork'));
    if(blobs.has(url))return Promise.resolve(blobs.get(url));
    if(jobs.has(url))return jobs.get(url);
    const promise=new Promise((resolve,reject)=>{
      queue.push(async()=>{
        let error;
        for(let attempt=0;attempt<2;attempt++){
          const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
          try {
            const response=await fetch(url,{signal:controller.signal});
            if(!response.ok)throw Error('HTTP '+response.status);
            const blob=await response.blob();
            const signature=new Uint8Array(await blob.slice(0,12).arrayBuffer());
            if(String.fromCharCode(...signature.slice(8,12))!=='WEBP')throw Error('Invalid image');
            clearTimeout(timer);const local=apply(url,blob);await persist(url,blob);notify();resolve(local);return;
          }catch(e){error=e;}finally{clearTimeout(timer);}
        }
        reject(error);
      });pump();
    });
    jobs.set(url,promise);promise.then(()=>jobs.delete(url),()=>jobs.delete(url));return promise;
  }
  const ready=open().then(()=>{notify();});
  const api={ready,url:value=>blobs.get(canonical(value)) || value,ensure,
    status:()=>({total:files.length,saved:saved.size,busy,done,failed,storage}),
    async downloadAll(){
      if(busy)return;
      busy=true;done=0;failed=0;notify();await ready;
      await Promise.all(files.map(async file=>{try{await ensure(file);}catch(_){failed++;}done++;notify();}));
      busy=false;notify();
    }
  };
  window.MovieKombatAssets=api;
  // Remember visible artwork after initial rendering, without delaying startup.
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      const urls=new Set(performance.getEntriesByType('resource').map(entry=>entry.name).filter(url=>allowed.has(url)));
      urls.forEach(url=>ensure(url).catch(()=>{}));
    },1000);
    setTimeout(()=>{
      if(typeof movieLists!=='undefined')movieLists.flat().forEach(movie=>ensure(movie.poster).catch(()=>{}));
    },3000);
  });
})();
