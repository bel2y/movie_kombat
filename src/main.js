(async () => {
  if (window.MovieKombatAssets) await window.MovieKombatAssets.ready;
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const soundButton = document.querySelector('.sound');
  const key = 'movie-kombat.history.v1';
  const names = new URLSearchParams(location.search).get('names')==='long' ? ['Александр Константинович','Анастасия Александровна'] : ['Илья', 'Наташа'];
  let selectionLists;
  let fixedRoster;
  function resultLabel(banner) {
    return ({
      'WINNER': 'Победитель',
      'PERFECT MATCH': 'Полное совпадение',
      'FLAWLESS VICTORY': 'Безупречная победа',
      'UPSET!': 'Неожиданная победа',
      '50/50': 'Равные шансы',
    })[banner] || 'Победитель';
  }
  let history = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) history = saved.filter(item => item && ['left', 'right'].includes(item.winner) &&
      item[item.winner] && item[item.winner].movie && typeof item.date === 'string');
  } catch (error) { /* Storage may be unavailable for local files. */ }
  const excludedKey = 'movie-kombat.excluded.v1';
  let excluded = new Set(history.map(item => item[item.winner].movie.id));
  try {
    const saved = JSON.parse(localStorage.getItem(excludedKey) || 'null');
    if (Array.isArray(saved)) excluded = new Set(saved);
  } catch (error) { /* Preserve exclusions derived from history. */ }
  const lossKey = 'movie-kombat.losses.v1';
  let lossCounts = history.reduce((counts,item)=>recordLoss(counts,item),{});
  try {
    const saved = JSON.parse(localStorage.getItem(lossKey) || 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) lossCounts = Object.fromEntries(Object.entries(saved).filter(([,n])=>Number.isFinite(n) && n>=0).map(([id,n])=>[id,Math.min(5,n)]));
  } catch (error) { /* Recover counters from existing history. */ }
  function availableLists() {
    return movieLists.map((list,side) => list.map((movie, index) => ({ ...tmdbRatings.movies[movie.id], ...movie, rank: index + 1, listSize: list.length, losses: lossCounts[(side ? 'right:' : 'left:') + movie.id] || 0 }))
      .filter(movie => !excluded.has(movie.id)));
  }
  const canBattle = () => availableLists().some(list => list.length > 0);
  const remainingPlayer = () => { const lists=availableLists(); return lists.every(list=>list.length) ? null : lists.findIndex(list=>list.length); };
  let previewPlayer = null;
  function battleButton(label, style) {
    return canBattle() ? button('start', remainingPlayer() !== null ? 'Выбрать фильм' : label, style, true)
      : '<div class="empty-arena"><p role="status">Все фильмы выбраны</p>'+button('reset','Сбросить битвы','',true)+'</div>';
  }
  let scene = 'home';
  let result;
  let reels;
  let stopReels = () => {};
  let previousWinners = new Set();
  let timers = [];
  let muted = false;
  let audio;

  function watchWinner() {
    if (scene !== 'result' || !result) return;
    const movie = result[result.winner].movie;
    const id = tmdbRatings.movies[movie.id]?.tmdbId || movie.tmdbId;
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return;
    if (audio) audio.suspend().catch(() => {});
    if (window.MovieKombatHost?.watch(Number(id))) return;
    // Keep the same origin as the user's MSX Lampa tile and its saved settings.
    location.assign('http://lampa.mx/?card=' + Number(id) + '&media=movie&source=tmdb');
  }

  const playing = () => ['intro', 'roulette', 'versus', 'winner'].includes(scene);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const artUrl = value => window.MovieKombatAssets?.url(value) || value;
  const button = (action, title, className = '', initial = false) =>
    `<button class="${className}" data-action="${action}" ${initial ? 'data-initial' : ''}>${title}</button>`;

  function poster(movie) {
    const image = movieLists.flat().find(item=>item.id===movie.id)?.poster || movie.poster;
    const unavailable = scene === 'roulette' ? previousWinners.has(movie.id) : false;
    return `<div class="movie-poster${unavailable ? ' already-won' : ''}"${unavailable ? ' title="Уже побеждал — не участвует в выборе"' : ''}><div class="poster-art" style="--hue:${String(movie.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360}">
      <span>${escape(movie.title)}</span>${image ? `<img src="${escape(artUrl(image))}" alt="">` : ''}
      </div></div>`;
  }

  const metalCorners = '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';
  const vsMark = '<img class="vs-mark" src="src/optimized/vs.5d2f7d658415.webp" alt="Против">';
  function fighter(i, extra = '') {
    return `<aside class="fighter team-${i} ${extra}"><div class="nameplate"><span>${escape(names[i])}</span></div></aside>`;
  }
  const participants = () => `<div class="participants">${result?.solo && (playing() || scene === 'result') ? fighter(result.winner === 'left' ? 0 : 1) : fighter(0)+fighter(1)}</div>`;
  function showcase() {
    const films = [movieLists[0][0], movieLists[1][2], movieLists[0][1], movieLists[1][5], movieLists[0][2]].filter(Boolean);
    if (scene === 'home') {
      const extra = movieLists.flat().filter(movie => !films.some(item => item.id === movie.id));
      films.unshift(...extra.slice(0, 1));
      films.push(...extra.slice(1, 2));
    }
    const featured = Math.floor(films.length / 2);
    return `<div class="showcase" aria-hidden="true">${films.map((movie, i) => `<div class="showcase-card ${i === featured ? 'featured' : ''}">${poster(movie)}${i === featured ? metalCorners : ''}</div>`).join('')}</div>`;
  }
  function scorePanel(side) {
    const entry=result[side];
    const score=entry.score || strength(entry.movie,entry.rank);
    const points=score.points || [score.desire*60,score.rating*25,score.losses*15].map(n=>Math.round(n*10)/10);
    const format=n=>Number(n.toFixed(1)).toLocaleString('ru-RU');
    let total=0;
    const labels=['Желание','Рейтинг','Надежда'];
    const icons=['♨','☆','♡'];
    return '<section class="combat-stats team-'+(side==='left'?0:1)+'" aria-label="Сила фильма '+escape(entry.movie.title)+'"><div class="stat-parts">'+points.map((n,i)=>'<div class="stat-part" style="--delay:'+(0.6+i*1.1)+'s"><span class="stat-value"><i aria-hidden="true">'+icons[i]+'</i> +'+format(n)+'</span><span class="stat-label">'+labels[i]+'</span></div>').join('')+'</div><div class="power-summary"><div class="power-bar" aria-hidden="true">'+points.map((n,i)=>'<span style="--points:'+n+'%;--delay:'+(0.6+i*1.1)+'s"></span>').join('')+'</div><div class="power-total"><span>Сила</span><b class="power-step initial">0</b>'+points.map((n,i)=>{total+=n;return '<b class="power-step stage-'+i+'" style="--delay:'+(0.6+i*1.1)+'s">'+format(total)+'</b>';}).join('')+'</div></div><span class="stats-help">'+(side==='left'?'':'')+'</span></section>';
  }
  function duel() {
    return gridArena(true)+'<div class="combat-panels">'+scorePanel('left')+scorePanel('right')+'</div><p class="combat-rule">'+(result.tied?'Сила равна — победителя определяет жребий.':'Желание + рейтинг + надежда. Побеждает большая сумма.')+'</p>';
  }
  function billboardContent(side,movie){
    return '<div class="cinema-backdrop" aria-hidden="true">'+(movie?poster(movie):'')+'</div><div class="billboard-art'+(movie?'':' is-empty')+'">'+(movie?poster(movie):'<span class="mystery" aria-label="Фильм ещё не выбран">?</span>')+'</div><div class="cinema-copy"><div class="cinema-player">'+escape(names[side])+'</div><h2>'+escape(movie?.title||'Выбираем фильм')+'</h2><p>'+ (movie?escape([movie.year,movie.genre].filter(Boolean).join(' · ')):'Ваш следующий фильм')+'</p></div>';
  }
  function billboard(side,movie){
    return '<article class="billboard cinema-panel team-'+side+'">'+billboardContent(side,movie)+'</article>';
  }
  function gridArena(selected=false) {
    const used=scene==='roulette'?previousWinners:excluded;
    const layout=fixedRoster||(fixedRoster=savedRosterLayout(movieLists,{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}));
    const racks='<section class="shared-roster" aria-label="Фильмы игроков" style="--columns:'+layout.columns+'">'+layout.tiles.map(({movie:m,side})=>'<div class="film-tile'+(used.has(m.id)?' is-watched':'')+' team-'+side+'" data-side="'+side+'" data-movie="'+escape(m.id)+'" tabindex="0" role="group" aria-label="'+escape(m.title)+(used.has(m.id)?' — уже выбран':'')+'">'+poster(m)+'<i class="tile-plinth" aria-hidden="true"></i><i class="target-corners" aria-hidden="true"></i></div>').join('')+'</section>';
    const available=availableLists().flat().length;
    const label=available===1?'Сегодня смотрим':'ЗАПУСК';
    return '<svg width="0" height="0" aria-hidden="true" style="position:absolute;pointer-events:none"><defs><clipPath id="player-ticket-left" clipPathUnits="objectBoundingBox"><path d="M .04 .003 L .91 .08 L 1 .5 L .91 .92 L .04 .997 Q .04 .91 0 .91 L 0 .59 C .05 .59 .05 .41 0 .41 L 0 .09 Q .04 .09 .04 .003 Z"/></clipPath><clipPath id="player-ticket-right" clipPathUnits="objectBoundingBox"><path d="M .96 .003 Q .96 .09 1 .09 L 1 .41 C .95 .41 .95 .59 1 .59 L 1 .91 Q .96 .91 .96 .997 L .09 .92 L 0 .5 L .09 .08 Z"/></clipPath></defs></svg><div class="billboard-stage">'+billboard(0,selected?result?.left?.movie:null)+billboard(1,selected?result?.right?.movie:null)+(selected?'':racks)+'<div class="arena-ticket-brand"><img src="src/ui/movie-kombat-tickets.png" alt="Movie Kombat"></div><div class="arena-vs plain-duel" role="img" aria-label="Против"><span>VS</span></div><div class="arena-action">'+(scene==='roulette'?'<p role="status">Выбираем фильмы</p>':canBattle()?button('start',label,'grid-fight',true):'<p>Все фильмы выбраны</p>'+button('reset','Сбросить битвы','',true))+'</div></div>';
  }
  function revealGridFilm(side,movie){
    const art=main.querySelector('.billboard.team-'+side);
    if(art)art.innerHTML=billboardContent(side,movie);
    if(!result.solo && !main.querySelector('.billboard-art.is-empty')){
      const status=main.querySelector('.arena-action [role="status"]');
      if(status)status.textContent='Фильмы выбраны';
    }
  }
  const views = {
    home: () => gridArena(),
    intro: () => gridArena(),
    roulette: () => gridArena(),
    versus: duel,
    winner: () => {
      const win = result[result.winner].movie;
      const lose = result[result.winner === 'left' ? 'right' : 'left'].movie;
      return `${participants()}<div class="reveal-layout"><div class="metal-poster golden">${poster(win)}${metalCorners}</div><div class="reveal-info"><h1>Победитель</h1><div class="nameplate team-${result.winner === 'left' ? 0 : 1}">${names[result.winner === 'left' ? 0 : 1]}</div><h2>${escape(win.title)}</h2>${vsMark}</div><div class="defeated">${poster(lose)}</div></div>`;
    },
    result: () => {
      const movie = result[result.winner].movie;
      const side=result.winner==='left'?0:1;
      return '<svg width="0" height="0" aria-hidden="true" style="position:absolute;pointer-events:none"><defs><clipPath id="result-ticket-clip" clipPathUnits="objectBoundingBox"><path transform="scale(0.000666666667 0.0015625)" d="M 48 2 H 417 A 23 23 0 0 0 463 2 H 1452 A 46 46 0 0 0 1498 48 V 274 A 46 46 0 0 0 1498 366 V 592 A 46 46 0 0 0 1452 638 H 463 A 23 23 0 0 0 417 638 H 48 A 46 46 0 0 0 2 592 V 366 A 46 46 0 0 0 2 274 V 48 A 46 46 0 0 0 48 2 Z"/></clipPath></defs></svg><article class="cinema-result result-ticket team-'+side+'"><div class="cinema-backdrop" aria-hidden="true">'+poster(movie)+'</div><div class="result-poster">'+poster(movie)+'</div><div class="result-copy"><p class="result-eyebrow">Сегодня смотрим</p><div class="cinema-player">'+escape(names[side])+(result.solo?' · Выбранный фильм':' · Победитель')+'</div><h1>'+escape(movie.title)+'</h1><p class="result-meta">'+escape([movie.year,movie.genre].filter(Boolean).join(' · '))+'</p><p class="result-description">'+escape(window.MK_OVERVIEWS?.[movie.id]?.overview||'Описание пока недоступно.')+'</p><div class="result-actions">'+button('watch','Смотреть','watch',true)+battleButton(result.solo?'Ещё фильм':'Реванш','')+button('home','На главную')+'</div></div></article>';
    },
    history: () => `${participants()}<h1 class="scene-title">История битв</h1><div class="history-frame"><ul class="log">${history.map((item, i) =>
      `<li tabindex="0">${poster(item[item.winner].movie)}<div class="history-title"><strong>${escape(item[item.winner].movie.title)}</strong>${i === 0 ? '<small>Последний выбор</small>' : ''}</div><div class="history-player"><span class="nameplate team-${item.winner === 'left' ? 0 : 1}">${names[item.winner === 'left' ? 0 : 1]}</span><time datetime="${escape(item.date)}">${escape(new Date(item.date).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'}))}</time></div><span class="trophy" aria-label="${item.solo ? 'Выбранный фильм' : 'Победа'}">${item.solo ? '▶' : '♛'}</span></li>`).join('')
      || '<li class="empty-history">Завершите первую битву, чтобы увидеть результат.</li>'}</ul>${metalCorners}</div><div class="history-tools">${button('reset','Сбросить битвы')}${button('assets','Графика')}</div>${button('home', 'На арену', 'back-arena', true)}`,
    reset: () => `<section class="utility"><h1>Сбросить все битвы?</h1><p>История очистится. Все фильмы снова будут участвовать в выборе, а бонусы за поражения обнулятся. Списки фильмов и сохранённая графика останутся.</p><div class="actions">${button('history','Отмена','',true)}${button('reset-confirm','Сбросить')}</div></section>`,
    assets: () => `<section class="utility"><h1>Графика на устройстве</h1><p>Один раз скачай постеры, персонажей и оформление. Сохранённые файлы будут загружаться из памяти этого устройства.</p><p class="asset-status" role="status"></p><progress class="asset-progress" max="65" value="0"></progress><div class="actions">${button('download-art','Скачать графику','primary',true)}${button('history','Назад')}</div></section>`,
  };

  let browseCard=null, browseTile=null, browseTimer;
  function closeBrowse(){clearTimeout(browseTimer);browseTile?.classList.remove('is-browsed');browseTile?.removeAttribute('aria-describedby');browseCard?.remove();browseCard=null;browseTile=null;}
  function positionBrowse(){
    if(!browseCard||!browseTile)return;
    const posterBox=browseCard.querySelector('.browse-poster').getBoundingClientRect();
    const copy=browseCard.querySelector('.browse-copy');
    copy.style.height=posterBox.height+'px';
    const description=browseCard.querySelector('.browse-description');
    const style=getComputedStyle(description);
    const available=copy.getBoundingClientRect().bottom-description.getBoundingClientRect().top-parseFloat(style.paddingTop)-1;
    description.style.webkitLineClamp=String(Math.max(1,Math.floor(available/parseFloat(style.lineHeight))));
    const tile=browseTile.getBoundingClientRect(), box=browseCard.getBoundingClientRect();
    const left=Math.max(12,Math.min(innerWidth-box.width-12,tile.left+tile.width/2-box.width*.28));
    const above=tile.top-box.height-18;
    const top=above>=12?above:Math.min(innerHeight-box.height-12,tile.bottom+18);
    browseCard.style.left=left+'px';browseCard.style.top=Math.max(12,top)+'px';
    browseCard.style.setProperty('--pointer-x',Math.max(24,Math.min(box.width-24,tile.left+tile.width/2-left))+'px');
    browseCard.classList.toggle('below-tile',above<12);
  }
  function openBrowse(tile){
    if(scene!=='home'||!tile)return;
    closeBrowse();browseTile=tile;
    const movie=movieLists[Number(tile.dataset.side)]?.find(m=>String(m.id)===tile.dataset.movie);
    if(!movie){closeBrowse();return;}
    const overview=window.MK_OVERVIEWS?.[movie.id]?.overview||'Описание пока недоступно.';
    browseCard=document.createElement('aside');browseCard.className='movie-browse';browseCard.id='movie-browse';browseCard.setAttribute('role','tooltip');
    browseCard.innerHTML='<div class="browse-surface"><div class="browse-backdrop" aria-hidden="true">'+poster(movie)+'</div><div class="browse-poster">'+poster(movie)+'</div><div class="browse-copy"><h2>'+escape(movie.title)+'</h2><p class="browse-meta">'+escape([movie.year,movie.genre].filter(Boolean).join(' · '))+'</p><p class="browse-description">'+escape(overview)+'</p></div></div><i class="browse-pointer" aria-hidden="true"></i>';
    document.body.append(browseCard);tile.classList.add('is-browsed');tile.setAttribute('aria-describedby','movie-browse');positionBrowse();
  }
  document.addEventListener('focusin',e=>{const tile=e.target.closest?.('.film-tile');if(tile)openBrowse(tile);else closeBrowse();});
  document.addEventListener('pointerover',e=>{const tile=e.target.closest?.('.film-tile');if(tile&&tile!==browseTile){clearTimeout(browseTimer);browseTimer=setTimeout(()=>openBrowse(tile),220);}else if(e.target.closest?.('.movie-browse'))clearTimeout(browseTimer);});
  document.addEventListener('pointerout',e=>{if(e.target.closest?.('.film-tile,.movie-browse')&&!e.relatedTarget?.closest?.('.film-tile,.movie-browse')){clearTimeout(browseTimer);browseTimer=setTimeout(closeBrowse,180);}});
  document.addEventListener('keydown',e=>{
    if(scene!=='home'||!browseTile)return;
    if(e.key==='Enter'||e.keyCode===13){e.preventDefault();e.stopImmediatePropagation();return;}
    if(['Escape','Backspace','BrowserBack'].includes(e.key)||e.keyCode===461||e.keyCode===10009){e.preventDefault();e.stopImmediatePropagation();closeBrowse();main.querySelector('[data-action="start"]')?.focus();}
  },true);
  window.addEventListener?.('resize',positionBrowse);

  function show(next) {
    closeBrowse();
    stopReels();
    window.MovieKombatAssets?.setMotion?.(["intro","roulette","versus","winner"].includes(next));
    const keepGrid=next==='roulette' && scene==='home' && main.querySelector('.billboard-stage');
    scene = next;
    document.querySelector('.shell').dataset.scene = next;
    const single = next === 'home' ? (previewPlayer ?? remainingPlayer()) : result?.solo && (playing() || next === 'result') ? (result.winner === 'left' ? 0 : 1) : null;
    main.className = next + (['home','roulette','versus'].includes(next)?' grid-arena':'') + (single !== null && single >= 0 ? ' single' : '');
    document.querySelector('.shell').dataset.single = single !== null && single >= 0 ? String(single) : '';
    nav.hidden = (playing() && next!=='roulette') || ['result','reset','assets'].includes(next);
    nav.querySelectorAll('button').forEach(item => item.classList.toggle('active', item.dataset.action === next));
    if(!keepGrid)main.innerHTML = views[next]() + (next==='versus' ? button('continue','Продолжить <kbd>OK</kbd>','skip continue',true) : playing() ? button('skip', 'Пропустить <kbd>OK</kbd>', 'skip', true) : '');
    main.querySelectorAll('.hero-logo').forEach(element => { element.append(document.querySelector('.brand-logo').cloneNode(true)); });
    if(window.MovieKombatAssets)document.querySelectorAll('img').forEach(img=>{const url=artUrl(img.getAttribute('src'));if(url!==img.getAttribute('src'))img.src=url;});
    if(next==='roulette'){
      const action=main.querySelector('.arena-action');if(action)action.innerHTML='<p role="status">Выбираем фильмы</p>'+button('skip','Пропустить','grid-fight',true);
      if(typeof runGridSelection==='function')stopReels=runGridSelection(main,selectionLists||availableLists(),result,revealGridFilm);
    }
    updateAssetStatus();
    const initial = main.querySelector(next==='versus'?'[data-action="continue"]':'[data-initial]');
    if (initial) initial.focus();
  }

  function updateAssetStatus() {
    const label=main.querySelector('.asset-status');if(!label)return;
    const state=window.MovieKombatAssets?.status();
    if(!state){label.textContent='Хранилище изображений недоступно.';return;}
    label.textContent=(state.busy ? `Загрузка: ${state.done} из ${state.total}. ` : '')+`Сохранено: ${state.saved} из ${state.total}.`+(state.failed ? ` Не загрузилось: ${state.failed}. Нажми «Скачать графику», чтобы повторить.` : '')+(['blocked','full'].includes(state.storage) ? '\nУстройство не разрешило сохранить все файлы. Загруженные изображения доступны только до закрытия игры.' : '');
    const progress=main.querySelector('.asset-progress');if(progress){progress.max=state.total;progress.value=state.busy?state.done:state.saved;}
    const download=main.querySelector('[data-action="download-art"]');if(download){download.setAttribute('aria-busy',String(state.busy));download.textContent=state.busy?'Загружаем…':state.completed?'Проверить загрузку':'Скачать графику';}
    if(state.completed&&!state.busy)label.textContent=(state.saved===state.total?'Готово! Вся графика сохранена на устройстве. ':'Загрузка завершена. ')+label.textContent;
  }
  if(window.addEventListener)window.addEventListener('mk-assets',updateAssetStatus);

  function resetBattles() {
    if(scene!=='reset')return;
    timers.forEach(clearTimeout);timers=[];
    history=[];excluded=new Set();previousWinners=new Set();lossCounts={};result=null;reels=null;
    try { [key,excludedKey,lossKey].forEach(name=>localStorage.removeItem(name)); } catch (_) { /* Storage may be disabled. */ }
    show('home');
  }

  function play(notes) {
    if (muted) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!audio) audio = new Audio();
      audio.resume().catch(() => {});
      notes.forEach((note, i) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const time = audio.currentTime + i * .12;
        oscillator.type = 'triangle';
        oscillator.frequency.value = note;
        gain.gain.setValueAtTime(.001, time);
        gain.gain.exponentialRampToValueAtTime(.12, time + .03);
        gain.gain.exponentialRampToValueAtTime(.001, time + .37);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(time);
        oscillator.stop(time + .38);
      });
    } catch (error) { /* Sound is optional. */ }
  }

  function start() {
    if (playing()) return;
    const available = availableLists();
    const nextResult = chooseRound(available[0], available[1]);
    if (!nextResult) { show('home'); return; }
    result = nextResult;
    if (!result) return;
    previousWinners = new Set(excluded);
    selectionLists=available;
    reels = available.map((movies, i) => {
      const entry=result[i ? 'right' : 'left']; if (!entry) return null; const finish=entry.movie;
      return buildReel(movies, finish.id, i === 1, window.innerWidth);
    });
    excluded.add(result[result.winner].movie.id);
    try { localStorage.setItem(excludedKey, JSON.stringify([...excluded])); } catch (error) { /* Storage is optional. */ }
    recordLoss(lossCounts, result);
    try { localStorage.setItem(lossKey, JSON.stringify(lossCounts)); } catch (error) { /* Storage is optional. */ }
    history.unshift(result);
    history.splice(100);
    try { localStorage.setItem(key, JSON.stringify(history)); } catch (error) { /* Storage is optional. */ }
    if(result.solo && available[result.winner==='left'?0:1].length===1){show('result');play([262,330,392,523]);return;}
    show('roulette');play([130,196]);
    const staticSelection=available.every(list=>list.length<=1);
    const duration=staticSelection?1000:9400;
    timers=[setTimeout(()=>{
      const stage=main.querySelector('.billboard-stage');if(stage)stage.classList.add('selection-done');
    },duration),setTimeout(()=>{show(result.solo?'result':'versus');play([196,233,294]);},duration+900)];
  }

  function continueBattle() {
    if (scene!=='versus') return;
    timers.forEach(clearTimeout);
    show('result');
    play([262,330,392,523]);
    timers=[];
  }

  function skip() {
    timers.forEach(clearTimeout);
    timers = [];
    if (audio) audio.suspend().catch(() => {});
    show(scene==='roulette'&&!result.solo?'versus':'result');
  }

  main.addEventListener('error', event => {
    if (event.target.tagName === 'IMG') {
      const img=event.target;img.hidden=true;
      if(window.MovieKombatAssets&&!img.dataset.retried){img.dataset.retried='1';window.MovieKombatAssets.ensure(img.src).then(url=>{img.src=url;img.hidden=false;}).catch(()=>{});}
    }
  }, true);
  document.addEventListener('click', event => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'start') start();
    else if (action === 'reset-confirm') resetBattles();
    else if (action === 'download-art') { window.MovieKombatAssets?.downloadAll(); }
    else if (action === 'continue') continueBattle();
    else if (action === 'watch') watchWinner();
    else if (action === 'skip' || (playing() && action === 'home')) skip();
    else if (action === 'sound') {
      muted = !muted;
      soundButton.textContent = muted ? 'Звук выкл.' : 'Звук вкл.';
      soundButton.setAttribute('aria-pressed', String(muted));
      if (muted && audio) audio.suspend().catch(() => {});
    } else if (Object.prototype.hasOwnProperty.call(views, action)) show(action);
  });

  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  function center(item) {
    const rect = item.getBoundingClientRect();
    return [rect.left + rect.width / 2, rect.top + rect.height / 2];
  }

  document.addEventListener('keydown', event => {
    if (['Escape', 'Backspace', 'BrowserBack'].includes(event.key) || event.keyCode === 461 || event.keyCode === 10009) {
      if (scene === 'home') {
        if (window.MovieKombatHost?.close()) event.preventDefault();
        return;
      }
      event.preventDefault();
      if (playing()) skip();
      else show('home');
      return;
    }
    if (event.key === 'Enter' || event.keyCode === 13) {
      if (playing() || event.repeat) event.preventDefault();
      if(!playing() && !event.repeat && document.activeElement?.matches?.('button[data-action]')) { event.preventDefault(); document.activeElement.click(); return; }
      if (playing() && !event.repeat) { if(scene==='versus') continueBattle(); else skip(); }
      return;
    }
    const direction = arrows[event.key];
    if (!direction) return;
    const [dx, dy] = direction;
    const [x, y] = center(document.activeElement);
    let best;
    let score = Infinity;
    document.querySelectorAll('button:not(:disabled), [tabindex="0"]').forEach(item => {
      if (!item.getClientRects().length) return;
      const [bx, by] = center(item);
      const forward = dx * (bx - x) + dy * (by - y);
      if (forward <= 1) return;
      const distance = forward + 2 * Math.abs(dx * (by - y) + dy * (bx - x));
      if (distance < score) { best = item; score = distance; }
    });
    if (best) { event.preventDefault(); best.focus(); }
  });

  // Read-only scene preview for visual review; never records a battle.
  const previewScene = new URLSearchParams(location.search).get('preview');
  if (previewScene && Object.prototype.hasOwnProperty.call(views, previewScene)) {
    let previewLists = canBattle() ? availableLists() : movieLists;
    const counts=(new URLSearchParams(location.search).get('remaining')||'').split(',').map(Number);
    if(counts.length===2 && counts.every(n=>Number.isInteger(n)&&n>=0&&n<=16) && counts.some(n=>n>0))previewLists=previewLists.map((list,i)=>list.slice(0,counts[i]));
    const singleParam=new URLSearchParams(location.search).get('player');
    previewPlayer=singleParam==='0'||singleParam==='1' ? Number(singleParam) : null;
    result=previewPlayer===null ? chooseRound(previewLists[0],previewLists[1],()=>.12) : chooseRound(previewPlayer===0?previewLists[0]:[],previewPlayer===1?previewLists[1]:[],()=>.12);
    previousWinners = new Set(excluded);
    reels = previewLists.map((movies, i) => result[i ? 'right' : 'left'] ? buildReel(movies, result[i ? 'right' : 'left'].movie.id, i === 1, window.innerWidth) : null);
    selectionLists=previewLists;
    show(previewScene);
  } else show('home');
})();


