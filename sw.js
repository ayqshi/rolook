const C='rbx-v1',PRE=['./','index.html','launch.png','LOGO.png','RB.png','https://cdn.tailwindcss.com','https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>Promise.all(PRE.map(u=>fetch(u,{mode:u.startsWith('http')?'no-cors':'same-origin'}).then(r=>c.put(u,r)).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!='GET'||/vercel\.app|qrserver/.test(u.hostname))return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>{const n=fetch(e.request).then(x=>{if(x&&(x.ok||x.type=='opaque')){const y=x.clone();caches.open(C).then(c=>c.put(e.request,y))}return x}).catch(()=>r);return r||n}))});
