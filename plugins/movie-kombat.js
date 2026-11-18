/* Movie Kombat plugin for Lampa. Install this URL in Settings → Extensions. */
(function () {
  'use strict';
  if (window.movieKombatPluginLoaded || !window.Lampa) return;
  window.movieKombatPluginLoaded = true;
  var appUrl = 'https://bel2y.github.io/movie_kombat/';
  // Normal script tags also allow a local integration harness without changing production URLs.
  if (document.currentScript && /\/plugins\/movie-kombat\.js(?:\?|$)/.test(document.currentScript.src)) {
    appUrl = new URL('../', document.currentScript.src).href;
  }
  var gameOrigin = new URL(appUrl).origin;
  var active = null;
  var installed = false;
  function openGame() {
    if (active) { active.frame.focus(); return; }
    var previous = Lampa.Controller.enabled ? Lampa.Controller.enabled().name : 'content';
    var session = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#03080e;z-index:100000;';
    var status = document.createElement('div');
    status.textContent = 'Загружаем Movie Kombat…';
    status.style.cssText = 'position:absolute;left:5%;top:45%;color:white;font:24px sans-serif;';
    var exit = document.createElement('button');
    exit.textContent = 'В Лампу';
    exit.style.cssText = 'position:absolute;left:12px;bottom:12px;z-index:2;background:#101820dd;color:#fff;border:1px solid #bba579;padding:8px 16px;font:16px sans-serif;';
    var frame = document.createElement('iframe');
    frame.title = 'Movie Kombat';
    frame.allow = 'autoplay; fullscreen';
    frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
    var timer;
    var connected = false;
    function close(restore) {
      if (!active || active.frame!==frame) return;
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      frame.onload = null;
      overlay.remove();
      active=null;
      // Replace closures so the controller does not retain a detached game and its images.
      Lampa.Controller.add('movie_kombat',{toggle:function(){},back:function(){Lampa.Controller.toggle('content');}});
      if (restore) Lampa.Controller.toggle(previous || 'content');
    }
    function send(type, extra) {
      frame.contentWindow.postMessage(Object.assign({channel:'movie-kombat-v1',session:session,type:type},extra || {}),gameOrigin);
    }
    function key(value) { send('key',{key:value}); }
    function receive(event) {
      var data=event.data;
      if (event.source!==frame.contentWindow || event.origin!==gameOrigin || !data || data.channel!=='movie-kombat-v1' || data.session!==session) return;
      if (data.type==='ready') {
        connected=true; clearTimeout(timer); status.remove(); send('connected'); frame.focus();
      } else if (data.type==='close') close(true);
      else if (data.type==='watch' && Number.isSafeInteger(data.tmdbId) && data.tmdbId>0) {
        close(false);
        Lampa.Activity.push({component:'full',id:data.tmdbId,method:'movie',source:'tmdb',card:{id:data.tmdbId,source:'tmdb'}});
      }
    }
    active={frame:frame};
    exit.onclick=function(){close(true);};
    window.addEventListener('message',receive);
    overlay.appendChild(status); overlay.appendChild(frame); overlay.appendChild(exit);
    document.body.appendChild(overlay);
    Lampa.Controller.add('movie_kombat',{
      toggle:function(){frame.focus();},
      left:function(){key('ArrowLeft');},right:function(){key('ArrowRight');},
      up:function(){key('ArrowUp');},down:function(){key('ArrowDown');},
      enter:function(){key('Enter');},back:function(){if(connected)key('Escape');else close(true);}
    });
    Lampa.Controller.toggle('movie_kombat');
    frame.onload=function(){frame.focus();};
    timer=setTimeout(function(){status.textContent='Не удалось загрузить игру. Вернитесь в Лампу и попробуйте ещё раз.';status.style.zIndex='3';},20000);
    var url=new URL(appUrl);
    url.searchParams.set('host','lampa');url.searchParams.set('parentOrigin',location.origin);url.searchParams.set('session',session);
    frame.src=url.href;
  }
  function install() {
    if(installed)return;
    installed=true;
    var icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18M21 3L3 21M3 3v6M3 3h6M21 3v6M21 3h-6"/></svg>';
    if (Lampa.Menu && Lampa.Menu.addButton) Lampa.Menu.addButton(icon,'Movie Kombat',openGame);
    else {
      var item=$('<li class="menu__item selector"><div class="menu__ico">'+icon+'</div><div class="menu__text">Movie Kombat</div></li>');
      item.on('hover:enter',openGame);
      $('.menu .menu__list').eq(0).append(item);
    }
  }
  if(window.appready)install();
  else Lampa.Listener.follow('app',function(event){if(event.type==='ready')install();});
})();
