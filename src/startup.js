/* Keep the TV interface covered until cached or downloaded artwork is ready. */
(() => {
  const screen=document.getElementById('startup');
  const label=document.getElementById('startup-status');
  const progress=document.getElementById('startup-progress');
  const retry=document.getElementById('startup-retry');
  const minimumDisplay=new Promise(resolve=>setTimeout(resolve,3000));
  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  let running=false;
  async function load(){
    if(running)return;
    running=true;retry.hidden=true;progress.value=0;label.textContent='Повторяем загрузку графики…';
    const assets=window.MovieKombatAssets;
    if(!assets){label.textContent='Не удалось загрузить приложение. Повторите запуск.';running=false;retry.hidden=false;return;}
    await assets.ready;
    let done=0;const failed=[];const files=assets.files;
    progress.max=files.length;
    await Promise.all(files.map(async file=>{
      try{await assets.ensure(file);}catch(_){failed.push({file,error:String(_?.message||_)});}
      progress.value=++done;
      label.textContent='Загружаем графику · '+done+' / '+files.length;
    }));
    running=false;
    if(failed.length){label.textContent='Не удалось загрузить '+failed.length+' файлов. '+failed[0].error+'. Повторите загрузку.';retry.hidden=false;retry.focus();return;}
    label.textContent='Подготавливаем интерфейс…';
    if(document.fonts)await document.fonts.ready;
    resolveReady();
  }
  function attempt(){
    if(!window.MovieKombatAssets){location.reload();return;}
    load().catch(()=>{running=false;label.textContent='Не удалось подготовить графику. Повторите загрузку.';retry.hidden=false;retry.focus();});
  }
  retry.addEventListener('click',attempt);
  document.addEventListener('keydown',event=>{
    if(screen.hidden||retry.hidden)return;
    if(event.key==='Enter'||event.keyCode===13){event.preventDefault();event.stopImmediatePropagation();attempt();}
  });
  window.MKStartup={ready,async reveal(){
    await minimumDisplay;
    const images=Array.from(document.querySelectorAll('.shell img')).filter(img=>!img.hidden);
    await Promise.all(images.map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve()));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    document.documentElement.classList.remove('is-booting');screen.hidden=true;
    document.querySelector('[data-initial]')?.focus?.();
  }};
  attempt();
})();
