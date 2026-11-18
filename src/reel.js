/* Repeat the full list around the entire travel path, including both endpoints. */
function buildReel(movies, selectedId, reverse, viewportWidth) {
  const travel = 44;
  // 105px is the smallest reel card. A full viewport of overscan also covers resizing.
  const padding = Math.ceil(viewportWidth / 105) + movies.length;
  const stop = padding + travel;
  const selected = movies.findIndex(movie => movie.id === selectedId);
  if (!movies.length || selected < 0) throw new Error('Selected movie is missing');
  const strip = Array.from({ length: padding * 2 + travel + 1 }, (_, index) =>
    movies[((selected + index - stop) % movies.length + movies.length) % movies.length]);
  return {
    movies: reverse ? strip.reverse() : strip,
    from: reverse ? stop : padding,
    to: reverse ? padding : stop,
  };
}
if (typeof module !== 'undefined') module.exports = { buildReel };
function reelWindow(reel, position, width, cardWidth) {
  const padding = Math.ceil(width / cardWidth * .7) + 1;
  const start = Math.floor(position) - padding;
  const length = padding * 2 + 1;
  return {start, offset:start-position, movies:Array.from({length},(_,i)=>reel.movies[((start+i)%reel.movies.length+reel.movies.length)%reel.movies.length])};
}

// Keep only the visible cards mounted, rather than four enormous GPU textures.
const reelCardPool = new Map();
function animateReels(root, reels, renderPoster) {
  const tracks = [...root.querySelectorAll('.reels section')].flatMap(section=>{
    const side=section.classList.contains('team-1')?1:0;
    return [...section.querySelectorAll('.strip')].map((element,index)=>({element,side,index,last:null,
      width:element.parentElement.clientWidth, card:0}));
  });
  // Resolve max()/calc() custom properties using a real card, before animation.
  tracks.forEach(track=>{
    // offsetWidth avoids the rotated bounding box and is supported on TV engines.
    const measure=document.createElement('div');measure.style.cssText='width:var(--reel-card);position:absolute;height:1px';track.element.append(measure);track.card=measure.offsetWidth;measure.remove();
    track.element.style.animation='none';
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bez=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
  const ease=x=>{let lo=0,hi=1;for(let n=0;n<12;n++){const m=(lo+hi)/2;if(bez(m,.12,.17)<x)lo=m;else hi=m;}return bez((lo+hi)/2,.68,1);};
  let request,first;
  function frame(now){
    if(first===undefined)first=now;
    let complete=true;
    for(const track of tracks){
      const progress=reduced?1:Math.min(1,(now-first)/(track.side?9950:9400));
      if(progress<1)complete=false;
      const reel=reels[track.side];const position=progress===1?reel.to:reel.from+(reel.to-reel.from)*ease(progress);
      const view=reelWindow(reel,position,track.width,track.card);
      if(track.last!==view.start){
        const occurrences=new Map();
        const nodes=view.movies.map(movie=>{
          const occurrence=occurrences.get(movie.id)||0;occurrences.set(movie.id,occurrence+1);
          const key=track.side+':'+track.index+':'+movie.id+':'+occurrence;
          const html=renderPoster(movie);let node=reelCardPool.get(key);
          if(!node){const holder=document.createElement('div');holder.innerHTML=html;node=holder.firstElementChild;reelCardPool.set(key,node);}
          node.classList.toggle('already-won',html.includes('already-won'));
          return node;
        });
        // Move existing image elements; do not restart image loading at every step.
        track.element.replaceChildren(...nodes);track.last=view.start;
      }
      track.element.style.transform='translate3d('+(view.offset*track.card)+'px,0,0)';
    }
    if(!complete)request=requestAnimationFrame(frame);
  }
  frame(performance.now());
  return ()=>cancelAnimationFrame(request);
}
if(typeof module!=='undefined')module.exports={buildReel,reelWindow};
