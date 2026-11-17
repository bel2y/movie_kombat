(() => {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const soundButton = document.querySelector('.sound');
  const key = 'movie-kombat.history.v1';
  const names = ['Игрок 1', 'Игрок 2'];
  let history = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) history = saved.filter(item => item && ['left', 'right'].includes(item.winner) &&
      item[item.winner] && item[item.winner].movie && typeof item.date === 'string');
  } catch { /* Storage may be unavailable for local files. */ }
  let scene = 'home';
  let result;
  let reels;
  let timers = [];
  let selectedList = 0;
  let muted = false;
  let audio;

  const playing = () => ['intro', 'roulette', 'versus', 'winner'].includes(scene);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const button = (action, title, className = '', initial = false) =>
    `<button class="${className}" data-action="${action}" ${initial ? 'data-initial' : ''}>${title}</button>`;

  function poster(movie) {
    return `<div class="movie-poster"><div class="poster-art" style="--hue:${movie.id % 360}">
      <span>${escape(movie.title)}</span>${movie.poster ? `<img src="${escape(movie.poster)}" alt="">` : ''}
      </div></div>`;
  }

  function duel() {
    const card = side => {
      const entry = result[side];
      return `<article class="${side} ${result.winner === side ? 'victor' : ''}">${poster(entry.movie)}
        <h2>${escape(entry.movie.title)}</h2><small>Позиция №${entry.rank}</small></article>`;
    };
    const reveal = scene === 'winner';
    return `<h1 class="scene-title">${reveal ? result.banner : 'Противостояние'}</h1>
      <div class="duel ${reveal ? 'reveal' : ''}">${card('left')}<span class="duel-vs">VS</span>${card('right')}</div>`;
  }

  const views = {
    home: () => `<div class="hero"><p class="eyebrow">АРЕНА КИНО</p><h1>MOVIE <em>KOMBAT</em></h1>
      <p class="subtitle">Два списка. Один фильм на вечер.</p></div>
      <div class="matchup">${names.map((name, i) => `
        <section class="player ${i ? 'red' : ''}"><div class="avatar" aria-hidden="true">${i ? '✦' : '◈'}</div>
          <h2>${name}</h2><p>${demoLists[i].length} фильмов</p></section>
        ${i ? '' : '<div class="home-vs" aria-hidden="true">VS</div>'}`).join('')}</div>
      ${button('start', 'FIGHT! <span aria-hidden="true">↗</span>', 'fight', true)}`,
    intro: () => '<h1 class="intro-title">MOVIE <em>KOMBAT</em></h1>',
    roulette: () => `<h1>Рулетка</h1><div class="reels">${reels.map((strip, i) =>
      `<section class="${i ? 'red' : ''}"><h2>${names[i]}</h2><div class="window">
      <div class="strip">${strip.map(poster).join('')}</div></div></section>`).join('')}</div>`,
    versus: duel,
    winner: duel,
    result: () => {
      const movie = result[result.winner].movie;
      return `<article class="final-card">${poster(movie)}<div><p class="eyebrow">${result.banner}</p>
        <h1>${escape(movie.title)}</h1><p class="subtitle">${movie.year} · ${escape(movie.genre)}</p>
        <div class="actions">${button('start', 'Реванш ↗', 'primary', true)}${button('home', 'На главную')}</div></div></article>`;
    },
    lists: () => `<h1>Списки фильмов</h1><div class="actions">${names.map((name, i) =>
      `<button data-action="list-${i}" ${i === selectedList ? 'data-initial' : ''} aria-pressed="${i === selectedList}">${name}</button>`).join('')}
      </div><ol class="collection">${demoLists[selectedList].map(movie =>
        `<li>${poster(movie)}<strong>${escape(movie.title)}</strong><small>${movie.year} · ${escape(movie.genre)}</small></li>`).join('')}</ol>`,
    history: () => `<h1>История битв</h1>${button('home', 'На арену', '', true)}<ul class="log">${history.map(item =>
      `<li><strong>${escape(item[item.winner].movie.title)}</strong><span>${escape(item.banner)}</span>
        <time datetime="${escape(item.date)}">${escape(item.date.slice(0, 10))}</time></li>`).join('')
      || '<li>Завершите первую битву, чтобы увидеть результат.</li>'}</ul>`,
  };

  function show(next) {
    scene = next;
    main.className = next;
    nav.hidden = playing();
    nav.querySelectorAll('button').forEach(item => item.classList.toggle('active', item.dataset.action === next));
    main.innerHTML = views[next]() + (playing() ? button('skip', 'Пропустить <kbd>OK</kbd>', 'skip', true) : '');
    const initial = main.querySelector('[data-initial]');
    if (initial) initial.focus();
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
    } catch { /* Sound is optional. */ }
  }

  function start() {
    if (playing()) return;
    result = battle(demoLists[0], demoLists[1]);
    if (!result) return;
    reels = demoLists.map((movies, i) => {
      const finish = i ? result.right.movie : result.left.movie;
      const startIndex = movies.indexOf(finish) + 1;
      return Array.from({ length: 21 }, (_, j) => j === 20 ? finish : movies[(startIndex + j) % movies.length]);
    });
    history.unshift(result);
    history.splice(100);
    try { localStorage.setItem(key, JSON.stringify(history)); } catch { /* Storage is optional. */ }
    show('intro');
    play([130, 196]);
    timers = [
      setTimeout(() => show('roulette'), 2000),
      setTimeout(() => { show('versus'); play([196, 233, 294]); }, 7000),
      setTimeout(() => { show('winner'); play([262, 330, 392, 523]); }, 10000),
      setTimeout(() => show('result'), 13000),
    ];
  }

  function skip() {
    timers.forEach(clearTimeout);
    timers = [];
    if (audio) audio.suspend().catch(() => {});
    show('result');
  }

  main.addEventListener('error', event => {
    if (event.target.tagName === 'IMG') event.target.hidden = true;
  }, true);
  document.addEventListener('click', event => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'start') start();
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
    if (['Escape', 'Backspace', 'BrowserBack'].includes(event.key) || event.keyCode === 461) {
      if (scene === 'home') return;
      event.preventDefault();
      if (playing()) skip();
      else show('home');
      return;
    }
    if (event.key === 'Enter' || event.keyCode === 13) {
      if (playing() || event.repeat) event.preventDefault();
      if (playing() && !event.repeat) skip();
      return;
    }
    const direction = arrows[event.key];
    if (!direction) return;
    const [dx, dy] = direction;
    const [x, y] = center(document.activeElement);
    let best;
    let score = Infinity;
    document.querySelectorAll('button:not(:disabled)').forEach(item => {
      if (!item.getClientRects().length) return;
      const [bx, by] = center(item);
      const forward = dx * (bx - x) + dy * (by - y);
      if (forward <= 1) return;
      const distance = forward + 2 * Math.abs(dx * (by - y) + dy * (bx - x));
      if (distance < score) { best = item; score = distance; }
    });
    if (best) { event.preventDefault(); best.focus(); }
  });

  show('home');
})();
