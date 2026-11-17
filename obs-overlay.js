(() => {
 const $=s=>document.querySelector(s), params=new URLSearchParams(location.search);
 const number=(value,fallback,min,max)=>Number.isFinite(Number(value))&&value!==null&&value!==''?Math.min(max,Math.max(min,Math.floor(Number(value)))):fallback;
 const layer=params.get('layer')||document.body.dataset.defaultLayer||'now';
 const limit=number(params.get('limit'),5,1,10),refresh=number(params.get('refresh'),60,15,3600)*1000;
 const cycle=number(params.get('cycle')??document.body.dataset.cycle,0,0,3600);
 let shelfPage=0;
 const isTbr=book=>['to read','to be read','tbr'].includes(String(book.status||'').trim().toLowerCase());

 const cfg=window.MIYUU_CONFIG||{}; let books=[],loaded=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status=s=>({'To read':'To be read','Reading':'Currently reading',"I've read it all!":'Completed','Pause':'Paused','Gave up':'DNF'}[s]||s||'Book');
 function cover(b){const url=window.MIYUU_COVERS.url(b);return `<div class="cover${url?' image':''}"><span>${esc(b.title)}</span><small>${esc((b.author||'').split(' ').slice(-1)[0])}</small>${url?`<img src="${esc(url)}" alt="Cover of ${esc(b.title)}" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.classList.remove('image');this.remove()">`:''}</div>`;}
 async function getBooks(){if(window.supabase&&cfg.supabaseUrl?.includes('.supabase.co')&&!cfg.supabaseUrl.includes('YOUR-PROJECT')&&cfg.supabaseAnonKey&&!cfg.supabaseAnonKey.includes('YOUR_')){try{const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);const {data,error}=await client.from('books').select('*').order('title');if(error)throw error;return (data||[]).map(b=>({title:b.title,author:b.author,status:b.status,pages:b.pages,currentPage:b.current_page||0,cover:b.cover_url,isbn:b.isbn,genre:b.genre}));}catch(e){throw e;}}
 const r=await fetch('data/books.json',{cache:'no-store'});return r.ok?await r.json():[];}
 function render(){const current=books.filter(b=>b.status==='Reading');const first=current[0];let html='';
 if(layer==='now'||layer==='current'){html=first?`<section class="panel now-card"><div class="brand">MIYUU90 · THE LITTLE LIBRARY</div><div class="book" style="margin-top:15px">${cover(first)}<div class="details"><div class="eyebrow">CURRENTLY READING</div><h1 class="title">${esc(first.title)}</h1><p class="author">${esc(first.author)}</p>${first.currentPage?`<div class="progress"><span style="width:${Math.min(100,Math.round(first.currentPage/(first.pages||1)*100))}%"></span></div><div class="meta">${first.currentPage} / ${first.pages||'?'} pages · ${Math.min(100,Math.round(first.currentPage/(first.pages||1)*100))}%</div>`:`<span class="pill">${first.pages?first.pages+' pages':'Reading in progress'}</span>`}</div></div></section>`:`<div class="panel empty">No current book selected · MIYUU90</div>`;}
 else if(layer==='tbr'){
  const list=books.filter(isTbr),pages=Math.max(1,Math.ceil(list.length/limit));
  shelfPage%=pages;
  const offset=shelfPage*limit,visible=list.slice(offset,offset+limit);
  html=`<section class="panel tbr-panel"><header class="tbr-heading"><div><div class="brand">MIYUU90 &middot; THE LITTLE LIBRARY</div><h1 class="heading">On my TBR</h1></div><span class="tbr-total">${list.length} ${list.length===1?'book':'books'} to read</span></header><div class="tbr-grid" style="--shelf-columns:${Math.min(5,visible.length)||1}">${visible.map(book=>`<article class="mini-book">${cover(book)}<h2 class="btitle">${esc(book.title)}</h2><p class="bauthor">${esc(book.author)}</p></article>`).join('')||'<p class="tbr-empty">A little room for your next story. No books marked To read yet.</p>'}</div>${list.length?`<div class="tbr-footer"><span>TO BE READ</span><span>${offset+1}-${Math.min(offset+limit,list.length)} of ${list.length}</span></div>`:''}</section>`;
 }
 else if(layer==='progress'){const b=first;const pct=b&&b.pages?Math.min(100,Math.round((b.currentPage||0)/b.pages*100)):0;html=b?`<section class="panel progress-panel"><div class="brand">MIYUU90 · READING NOW</div><div class="bookline">${esc(b.title)}</div><p class="author">${esc(b.author)}</p><div class="big">${pct}%</div><div class="progress"><span style="width:${pct}%"></span></div><div class="meta">${b.currentPage||0} of ${b.pages||'?'} pages</div></section>`:`<div class="panel empty">No current book selected</div>`;}
 else if(layer==='ticker'){html=`<div class="ticker"><i class="dot"></i><span>${first?`NOW READING · ${esc(first.title)} — ${esc(first.author)}`:'MIYUU90 · Gaming, books & occasional chaos'}</span></div>`;}
 else {let list=layer==='finished'?books.filter(b=>b.status==="I've read it all!"):layer==='tbr'?books.filter(b=>b.status==='To read'):books.filter(b=>b.status==='Reading');list=list.slice(0,limit);html=`<section class="panel shelf-panel"><div class="brand">MIYUU90 · THE LITTLE LIBRARY</div><h2 class="heading">${layer==='finished'?'Recently finished':layer==='tbr'?'On my TBR':'Currently reading'}</h2><div class="mini-grid">${list.map(b=>`<article class="mini-book">${cover(b)}<div class="btitle">${esc(b.title)}</div><div class="bauthor">${esc(b.author)}</div></article>`).join('')||'<p class="empty">Nothing on this shelf yet.</p>'}</div></section>`;}
 $('#content').innerHTML=html;$('#overlay').className='layer-'+layer;
 }
 async function update(){try{books=await getBooks();loaded=true;render();}catch(e){loaded=false;$('#content').innerHTML='<div class="panel empty">Could not load library data.</div>';}}
 update();setInterval(update,refresh);
 if(layer==='tbr'&&cycle>0)setInterval(()=>{if(loaded){shelfPage++;render();}},Math.max(5,cycle)*1000);
})();
