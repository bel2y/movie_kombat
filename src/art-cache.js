// Optional enhancement: MSX / television engines without SW still run normally.
window.addEventListener('load', async () => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const rememberVisible = () => {
      const worker = navigator.serviceWorker.controller;
      if (!worker) return;
      const urls = performance.getEntriesByType('resource').map(entry=>entry.name);
      worker.postMessage({type:'CACHE_VISIBLE_ART', urls});
    };
    if (navigator.serviceWorker.controller) rememberVisible();
    else navigator.serviceWorker.addEventListener('controllerchange',rememberVisible,{once:true});
    // No permission prompts or bulk download of all characters on first launch.
    registration.update().catch(()=>{});
  } catch (_) { /* Unsupported or blocked storage is not a startup error. */ }
});
