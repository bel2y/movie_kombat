(async () => {
  if (window.MovieKombatAssets) await window.MovieKombatAssets.ready;
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const soundButton = document.querySelector('.sound');
  const key = 'movie-kombat.history.v1';
  const names = ['Илья', 'Наташа'];
  let playerFighters = pickFighters();
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
      : '<p role="status">Все фильмы уже выбраны. Добавьте новые фильмы в списки.</p>';
  }
  let scene = 'home';
  let result;
  let reels;
  let stopReels = () => {};
  let previousWinners = new Set();
  let timers = [];
  let selectedList = 0;
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
    const unavailable = scene === 'roulette' ? previousWinners.has(movie.id) : scene === 'lists' && excluded.has(movie.id);
    return `<div class="movie-poster${unavailable ? ' already-won' : ''}"${unavailable ? ' title="Уже побеждал — не участвует в выборе"' : ''}><div class="poster-art" style="--hue:${String(movie.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360}">
      <span>${escape(movie.title)}</span>${image ? `<img src="${escape(artUrl(image))}" alt="">` : ''}
      </div></div>`;
  }

  const metalCorners = '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';
  const vsMark = '<img class="vs-mark" src="src/optimized/vs.5d2f7d658415.webp" alt="Против">';
  function fighter(i, extra = '') {
    return `<aside class="fighter team-${i} ${extra}"><div class="fighter-art"><img src="src/fighters/${playerFighters[i].image}" alt=""></div><div class="nameplate"><span>${names[i]}</span></div></aside>`;
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
    const card = side => {
      const entry = result[side];
      return `<article class="${side}"><div class="metal-poster">${poster(entry.movie)}${metalCorners}</div>
        <div class="contender-caption"><h2>${escape(entry.movie.title)}</h2><p>${entry.movie.year} · ${escape(entry.movie.genre)}</p></div></article>`;
    };
    return `${participants()}<h1 class="scene-title">Схватка</h1>
      <div class="duel">${card('left')}${vsMark}${card('right')}</div><div class="combat-panels">${scorePanel('left')}${scorePanel('right')}</div><p class="combat-rule">${result.left.movie.id===result.right.movie.id ? 'Один фильм в обоих списках — полное совпадение.' : result.tied ? 'Сила равна — победителя определяет жребий.' : 'Желание + рейтинг + надежда. Побеждает большая сумма.'}</p>`;
  }

  function singleHome(i) {
    let movies=availableLists()[i];
    const params=new URLSearchParams(location.search);
    const count=Number(params.get('count'));
    if (params.get('preview')==='home' && [1,2,3].includes(count)) movies=movies.slice(0,count);
    const films=(movies.length ? movies : movieLists[i]).slice(0,5);
    const featured=Math.floor((films.length-1)/2);
    const noun=movies.length===1?'фильм':movies.length>=2&&movies.length<=4?'фильма':'фильмов';
    return '<div class="single-player">'+fighter(i)+'<p class="single-count">'+movies.length+' '+noun+'</p></div><div class="single-heading"><h1>'+(movies.length===1?'Остался один фильм':'Выбираем фильм')+'</h1><p>Из списка '+(i ? 'Наташи' : 'Ильи')+'</p></div><div class="showcase single-static" data-count="'+films.length+'">'+films.map((movie,index)=>'<div class="showcase-card '+(index===featured?'featured':'')+'">'+poster(movie)+'</div>').join('')+'</div>'+button('start',movies.length===1?'Сегодня смотрим':'Выбрать фильм','fight',true);
  }
  const views = {
    home: () => (previewPlayer ?? remainingPlayer()) !== null && (previewPlayer ?? remainingPlayer()) >= 0 ? singleHome(previewPlayer ?? remainingPlayer()) : `${showcase()}<div class="home-fighters">${names.map((name, i) => `<div class="home-player team-${i}">${fighter(i)}<p class="film-count">${availableLists()[i].length} фильмов</p></div>`).join('')}</div><div class="home-versus">${vsMark}</div>${battleButton('В БОЙ!', 'fight')}`,
    intro: () => `${participants()}<h1 class="scene-title">Битва начинается</h1><div class="intro-emblem"><img src="src/optimized/intro-emblem.d5ee62f67913.webp" alt="Movie Kombat — противостояние"></div><div class="intro-flare" aria-hidden="true"></div>`,
    roulette: () => `${participants()}<h1 class="scene-title">${result.solo ? "Выбираем фильм" : "Выбираем соперников"}</h1><div class="reels">${reels.map((strip, i) => strip ?
      `<section class="team-${i}"><div class="window"><div class="strip" style="--reel-from:${-strip.from};--reel-to:${-strip.to}"></div></div><div class="selection-frame" aria-hidden="true"><div class="focus-window"><div class="strip" style="--reel-from:${-strip.from};--reel-to:${-strip.to}"></div></div>${metalCorners}</div><div class="metal-poster reel-lock">${poster(result[i ? 'right' : 'left'].movie)}${metalCorners}</div></section>` : '').join('')}</div><div class="reel-versus"><img class="vs-mark" src="src/optimized/home-vs.2b654653a8c6.webp" alt="Против"></div>`,
    versus: duel,
    winner: () => {
      const win = result[result.winner].movie;
      const lose = result[result.winner === 'left' ? 'right' : 'left'].movie;
      return `${participants()}<div class="reveal-layout"><div class="metal-poster golden">${poster(win)}${metalCorners}</div><div class="reveal-info"><h1>Победитель</h1><div class="nameplate team-${result.winner === 'left' ? 0 : 1}">${names[result.winner === 'left' ? 0 : 1]}</div><h2>${escape(win.title)}</h2>${vsMark}</div><div class="defeated">${poster(lose)}</div></div>`;
    },
    result: () => {
      const movie = result[result.winner].movie;
      return `${participants()}<article class="final-card"><div class="metal-poster golden">${poster(movie)}${metalCorners}</div><div class="winner-info">${result.solo ? '' : '<p class="winner-seal">Победитель</p>'}<p class="winner-kicker">Сегодня смотрим</p>
        <h1>${escape(movie.title)}</h1><p class="subtitle">${movie.year} · ${escape(movie.genre)}</p>
        <div class="actions">${button('watch', 'Смотреть', 'primary watch', true)}${battleButton(result.solo ? 'Ещё фильм' : 'Реванш', '')}${button('home', 'На главную')}</div></div></article>`;
    },
    lists: () => `${participants()}<h1 class="scene-title">Списки фильмов</h1><div class="actions list-tabs">${names.map((name, i) =>
      `<button data-action="list-${i}" ${i === selectedList ? 'data-initial' : ''} aria-pressed="${i === selectedList}">${name}</button>`).join('')}
      </div><div class="collection-frame"><ol class="collection">${movieLists[selectedList].map(movie =>
        `<li tabindex="0">${poster(movie)}<strong>${escape(movie.title)}</strong></li>`).join('')}</ol>${metalCorners}</div>${button('home', 'На арену', 'back-arena')}`,
    history: () => `${participants()}<h1 class="scene-title">История битв</h1><div class="history-frame"><ul class="log">${history.map((item, i) =>
      `<li tabindex="0">${poster(item[item.winner].movie)}<div class="history-title"><strong>${escape(item[item.winner].movie.title)}</strong>${i === 0 ? '<small>Последний выбор</small>' : ''}</div><div class="history-player"><span class="nameplate team-${item.winner === 'left' ? 0 : 1}">${names[item.winner === 'left' ? 0 : 1]}</span><time datetime="${escape(item.date)}">${escape(new Date(item.date).toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'}))}</time></div><span class="trophy" aria-label="${item.solo ? 'Выбранный фильм' : 'Победа'}">${item.solo ? '▶' : '♛'}</span></li>`).join('')
      || '<li class="empty-history">Завершите первую битву, чтобы увидеть результат.</li>'}</ul>${metalCorners}</div><div class="history-tools">${button('reset','Сбросить битвы')}${button('assets','Графика')}</div>${button('home', 'На арену', 'back-arena', true)}`,
    reset: () => `<section class="utility"><h1>Сбросить все битвы?</h1><p>История очистится. Все фильмы снова будут участвовать в выборе, а бонусы за поражения обнулятся. Списки фильмов и сохранённая графика останутся.</p><div class="actions">${button('history','Отмена','',true)}${button('reset-confirm','Сбросить')}</div></section>`,
    assets: () => `<section class="utility"><h1>Графика на устройстве</h1><p>Один раз скачай постеры, персонажей и оформление. Сохранённые файлы будут загружаться из памяти этого устройства.</p><p class="asset-status" role="status"></p><progress class="asset-progress" max="65" value="0"></progress><div class="actions">${button('download-art','Скачать графику','primary',true)}${button('history','Назад')}</div></section>`,
  };

  function show(next) {
    stopReels();
    window.MovieKombatAssets?.setMotion?.(["intro","roulette","versus","winner"].includes(next));
    if (next === 'home' && scene !== 'home') playerFighters = pickFighters();
    scene = next;
    document.querySelector('.shell').dataset.scene = next;
    const single = next === 'home' ? (previewPlayer ?? remainingPlayer()) : result?.solo && (playing() || next === 'result') ? (result.winner === 'left' ? 0 : 1) : null;
    main.className = next + (single !== null && single >= 0 ? ' single' : '');
    document.querySelector('.shell').dataset.single = single !== null && single >= 0 ? String(single) : '';
    nav.hidden = playing() || ['result','reset','assets'].includes(next);
    nav.querySelectorAll('button').forEach(item => item.classList.toggle('active', item.dataset.action === next));
    main.innerHTML = views[next]() + (next==='versus' ? button('continue','Продолжить <kbd>OK</kbd>','skip continue',true) : playing() ? button('skip', 'Пропустить <kbd>OK</kbd>', 'skip', true) : '');
    main.querySelectorAll('.hero-logo').forEach(element => { element.append(document.querySelector('.brand-logo').cloneNode(true)); });
    if(window.MovieKombatAssets)document.querySelectorAll('img').forEach(img=>{const url=artUrl(img.getAttribute('src'));if(url!==img.getAttribute('src'))img.src=url;});
    if(next==='roulette' && typeof animateReels==='function') stopReels=animateReels(main,reels,poster);
    updateAssetStatus();
    const initial = main.querySelector('[data-initial]');
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
    reels = movieLists.map((movies, i) => {
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
    if (result.solo) {
      const remaining = available[result.winner === 'left' ? 0 : 1];
      if (remaining.length === 1) {
        show('result');
        play([262,330,392,523]);
        return;
      }
      show('roulette');
      play([130,196]);
      timers=[setTimeout(()=>{show('result');play([262,330,392,523]);},10500)];
      return;
    }
    show('intro');
    play([130, 196]);
    timers = [
      setTimeout(() => show('roulette'), 2000),
      setTimeout(() => { show('versus'); play([196, 233, 294]); }, 12000),
    ];
  }

  function continueBattle() {
    if (scene!=='versus') return;
    timers.forEach(clearTimeout);
    show('winner');
    play([262,330,392,523]);
    timers=[setTimeout(()=>show('result'),3000)];
  }

  function skip() {
    timers.forEach(clearTimeout);
    timers = [];
    if (audio) audio.suspend().catch(() => {});
    show('result');
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
    } else if (action === 'list-0' || action === 'list-1') {
      selectedList = Number(action.slice(-1));
      show('lists');
    } else show(action);
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
    const previewLists = canBattle() ? availableLists() : movieLists;
    const singleParam=new URLSearchParams(location.search).get('player');
    previewPlayer=singleParam==='0'||singleParam==='1' ? Number(singleParam) : null;
    result=previewPlayer===null ? chooseRound(previewLists[0],previewLists[1],()=>.12) : chooseRound(previewPlayer===0?movieLists[0]:[],previewPlayer===1?movieLists[1]:[],()=>.12);
    previousWinners = new Set(excluded);
    reels = movieLists.map((movies, i) => result[i ? 'right' : 'left'] ? buildReel(movies, result[i ? 'right' : 'left'].movie.id, i === 1, window.innerWidth) : null);
    show(previewScene);
  } else show('home');
})();


