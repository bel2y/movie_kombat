/* Shuffle tiles once; animate only each owner's eligible selection outlines. */
function rosterLayout(lists,random=Math.random){
 const tiles=lists.flatMap((list,side)=>list.map(movie=>({movie,side})));
 for(let i=tiles.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}
 const columns=Math.max(1,Math.ceil(tiles.length/2));
 return {columns,tiles:tiles.map((t,i)=>({...t,row:Math.floor(i/columns)+1,column:i%columns+1}))};
}
function savedRosterLayout(lists,storage,random=Math.random){
 const key='movie-kombat.roster-order.v1';
 let saved;
 try{saved=JSON.parse(storage.getItem(key)||'null');}catch(error){}
 const entries=lists.flatMap((list,side)=>list.map(movie=>({movie,side})));
 const id=t=>t.side+':'+t.movie.id;
 const remaining=new Map(entries.map(t=>[id(t),t]));
 const tiles=[];
 if(Array.isArray(saved)){
  for(const k of saved){if(remaining.has(k)){tiles.push(remaining.get(k));remaining.delete(k);}}
  tiles.push(...remaining.values());
 }else tiles.push(...rosterLayout(lists,random).tiles);
 try{storage.setItem(key,JSON.stringify(tiles.map(id)));}catch(error){}
 const columns=Math.max(1,Math.ceil(tiles.length/2));
 return {columns,tiles:tiles.map((t,i)=>({...t,row:Math.floor(i/columns)+1,column:i%columns+1}))};
}
function selectionRoute(movies,selectedId,random=Math.random){
 const ids=[...new Set(movies.map(m=>m.id))];
 if(!ids.includes(selectedId))return [];
 if(ids.length===1)return [selectedId];
 const route=[];
 for(let i=0;i<48;i++){
  const choices=ids.filter(id=>id!==route.at(-1)&&(i!==47||id!==selectedId));
  if(!choices.length)break;
  route.push(choices[Math.floor(random()*choices.length)]);
 }
 if(route.at(-1)===selectedId)route.pop();
 route.push(selectedId);
 return route;
}
function runGridSelection(root,lists,result,onReveal){
 const timers=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 lists.forEach((movies,side)=>{
  const entry=result[side?'right':'left'];if(!entry)return;
  const route=selectionRoute(movies,entry.movie.id);
  let previous;
  route.forEach((id,step)=>{
   const duration=side?9000:8300;
   const progress=route.length===1?0:step/(route.length-1);
   const delay=reduced?0:duration*(.45*progress+.55*Math.pow(progress,4));
   const tick=()=>{
    if(previous)previous.classList.remove('is-running');
    previous=root.querySelector('.film-tile[data-side="'+side+'"][data-movie="'+id+'"]');
    if(previous)previous.classList.add('is-running');
    if(step===route.length-1){if(previous)previous.classList.add('is-selected');onReveal(side,entry.movie);}
   };
   if(step===0||reduced&&step===route.length-1)tick();
   else if(!reduced)timers.push(setTimeout(tick,delay));
  });
 });
 return ()=>timers.forEach(clearTimeout);
}
if(typeof module!=='undefined')module.exports={selectionRoute,rosterLayout,savedRosterLayout};
