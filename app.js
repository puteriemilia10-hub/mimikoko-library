let books=[];let supabaseClient=null;let session=null;let pendingCsv=null;
const $=s=>document.querySelector(s);const CONFIG=window.MIYUU_CONFIG||{};
const connected=()=>window.supabase&&CONFIG.supabaseUrl?.includes('.supabase.co')&&!CONFIG.supabaseUrl.includes('YOUR-PROJECT')&&CONFIG.supabaseAnonKey&&!CONFIG.supabaseAnonKey.includes('YOUR_');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel=s=>({'To read':'To read','Reading':'Currently reading',"I've read it all!":'Completed','Pause':'Paused','Gave up':'DNF'}[s]||s||'Unsorted');
const shelfOrder=['To read','Reading',"I've read it all!",'Pause','Gave up'];
function shelfStatus(value){const raw=String(value||'').trim();const aliases={'to read':'To read','to be read':'To read','tbr':'To read','reading':'Reading','currently reading':'Reading',"i've read it all!":"I've read it all!",'completed':"I've read it all!",'complete':"I've read it all!",'finished':"I've read it all!",'pause':'Pause','paused':'Pause','gave up':'Gave up','dnf':'Gave up'};return aliases[raw.toLowerCase()]||raw||'Unsorted';}
function cover(b){const url=window.MIYUU_COVERS.url(b);return `<div class="cover${url?' image-cover':''}"><span>${esc(b.title)}</span><small>${esc((b.author||'').split(' ').slice(-1)[0])}</small>${url?`<img src="${esc(url)}" alt="Cover of ${esc(b.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.classList.remove('image-cover');this.remove()">`:''}</div>`;}
async function init(){try{if(connected()){supabaseClient=window.supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey);const {data,error}=await supabaseClient.from('books').select('*').order('title');if(!error&&data?.length){books=data.map(fromDb);$('#connectionNote').textContent='Live library · updates are shared with every visitor.';}else{books=await loadFallback();$('#connectionNote').textContent='Database connected. Import your CSV in Library admin to publish your collection.';}const {data:auth}=await supabaseClient.auth.getSession();session=auth.session;setAdmin();supabaseClient.auth.onAuthStateChange((_e,s)=>{session=s;setAdmin();});}else{books=await loadFallback();$('#connectionNote').textContent='Preview mode · connect Supabase to publish live updates.';}}catch(e){books=await loadFallback();$('#connectionNote').textContent='Preview mode · could not reach the live database.';}render();}
async function loadFallback(){const r=await fetch('data/books.json');return r.ok?await r.json():[];}
function fromDb(b){return {key:b.book_key,title:b.title,author:b.author,status:b.status,pages:b.pages,genre:b.genre,isbn:b.isbn,publisher:b.publisher,language:b.language,rating:b.rating,cover:b.cover_url,currentPage:b.current_page||0};}
function render(){books=books.map(book=>({...book,status:shelfStatus(book.status)}));const counts={'To read':0,'Reading':0,"I've read it all!":0};books.forEach(b=>counts[b.status]=(counts[b.status]||0)+1);$('#totalCount').textContent=books.length;$('#finishedCount').textContent=counts["I've read it all!"]||0;$('#tbrCount').textContent=counts['To read']||0;$('#readingCount').textContent=counts.Reading||0;const current=books.filter(b=>b.status==='Reading');$('#currentBooks').innerHTML=current.map(b=>{let pct=b.pages?Math.min(100,Math.round((Number(b.currentPage||0)/b.pages)*100)):0;return `<article class="current-card">${cover(b)}<div><p class="eyebrow">CURRENTLY READING</p><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p>${b.currentPage?`<div class="progress"><span style="width:${pct}%"></span></div><p class="muted">${b.currentPage} / ${b.pages||'?'} pages · ${pct}%</p>`:`<p class="muted">${b.pages?b.pages+' pages':'Reading in progress'}</p>`}</div></article>`}).join('')||'<p class="muted">No current reads yet.</p>';filterBooks();}
function bookCard(b){return `<article class="book-card">${cover(b)}<h4>${esc(b.title)}</h4><p>${esc(b.author)}</p><span class="badge">${esc(statusLabel(b.status))}</span>${b.genre?`<small class="genre">${esc(b.genre)}</small>`:''}</article>`;}
function filterBooks(){
  const query=$('#search').value.trim().toLowerCase(),selected=$('#statusFilter').value,sort=$('#sort').value;
  const list=books.filter(book=>(selected==='all'||book.status===selected)&&`${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(query));
  const field=sort==='author'?'author':'title';
  list.sort((a,b)=>String(a[field]||'').localeCompare(String(b[field]||''))||String(a.title||'').localeCompare(String(b.title||'')));
  const statuses=[...shelfOrder,...new Set(list.map(book=>book.status).filter(status=>!shelfOrder.includes(status)))];
  $('#resultCount').textContent=`${list.length} ${list.length===1?'title':'titles'}`;
  $('#bookGrid').innerHTML=statuses.map((status,index)=>{
    const shelf=list.filter(book=>book.status===status);
    if(!shelf.length)return '';
    return `<section class="status-shelf" aria-labelledby="shelf-heading-${index}"><div class="shelf-heading"><h3 id="shelf-heading-${index}">${esc(statusLabel(status))}</h3><span class="shelf-count">${shelf.length} ${shelf.length===1?'book':'books'}</span></div><div class="book-grid">${shelf.map(bookCard).join('')}</div></section>`;
  }).join('');
  $('#empty').classList.toggle('hidden',list.length!==0);
}

function setAdmin(){const signed=!!session;$('#signedOut').classList.toggle('hidden',signed);$('#signedIn').classList.toggle('hidden',!signed);}
function parseCSV(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){cell+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell='';}else cell+=c;}row.push(cell);if(row.some(x=>x!==''))rows.push(row);const headers=rows.shift().map(x=>x.trim());return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));}
function hashKey(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function mapCsv(rows){return rows.filter(r=>r.Title?.trim()).map(r=>{let title=r.Title.trim(),author=(r.Authors||'Unknown author').trim(),status=r['Read status']||'To read',pages=Number((r['Total pages']||'').match(/\d+/)?.[0]||0);return {book_key:hashKey((r.ISBN||'')+'|'+title.toLowerCase()+'|'+author.toLowerCase()),title,author,status,pages,genre:r['Tags in use']||r.Collections||'',isbn:r.ISBN||'',publisher:r.Publisher||'',language:r.Language||'',rating:Number(r['Reading log 1 - Star ratings'])||null};});}
$('#search').addEventListener('input',filterBooks);$('#statusFilter').addEventListener('change',filterBooks);$('#sort').addEventListener('change',filterBooks);$('#adminOpen').onclick=()=>$('#adminModal').classList.remove('hidden');$('#closeModal').onclick=()=>$('#adminModal').classList.add('hidden');$('#adminModal').onclick=e=>{if(e.target.id==='adminModal')$('#adminModal').classList.add('hidden')};
$('#signIn').onclick=async()=>{if(!supabaseClient){$('#adminStatus').textContent='First configure config.js with your Supabase URL and anon key.';return;}let {error}=await supabaseClient.auth.signInWithPassword({email:$('#adminEmail').value,password:$('#adminPassword').value});if(error)alert(error.message);};
$('#signOut').onclick=async()=>{await supabaseClient.auth.signOut();};$('#csvFile').onchange=e=>{pendingCsv=e.target.files[0];$('#adminStatus').textContent=pendingCsv?`Selected ${pendingCsv.name}. Click Import and publish CSV.`:'Choose a CSV file.';};
$('#importCsv').onclick=async()=>{if(!session||!pendingCsv){$('#adminStatus').textContent='Sign in and choose a Bookmory CSV first.';return;}try{const mapped=mapCsv(parseCSV(await pendingCsv.text()));if(!mapped.length)throw Error('No book rows found. Check that this is a Bookmory library CSV.');let {error}=await supabaseClient.from('books').upsert(mapped,{onConflict:'book_key',defaultToNull:false});if(error)throw error;const {data,error:readErr}=await supabaseClient.from('books').select('*').order('title');if(readErr)throw readErr;books=data.map(fromDb);render();$('#adminStatus').textContent=`Published ${mapped.length} books. Your public library is updated.`;pendingCsv=null;$('#csvFile').value='';}catch(e){$('#adminStatus').textContent='Import failed: '+(e.message||String(e));}};
let findingCovers=false;
$('#findCovers').onclick=async()=>{
  if(findingCovers||!session||!supabaseClient)return;
  const missing=books.filter(book=>book.key&&!book.cover);
  if(!missing.length){$('#coverStatus').textContent='No missing covers. Import your library first if you have not published it yet.';return;}
  findingCovers=true;
  const owner=session.user.id;
  $('#findCovers').disabled=true;
  $('#importCsv').disabled=true;
  let checked=0,saved=0,googleSaved=0;
  let googleKey=(CONFIG.googleBooksApiKey||'').trim();
  const warnings=new Set();
  if(!googleKey)warnings.add('Google Books was skipped: add your Google Books API key to config.js to enable it.');
  try{
    for(let offset=0;offset<missing.length;offset+=10){
      if(!session||session.user.id!==owner)throw Error('Search stopped because you signed out.');
      $('#coverStatus').textContent=`Searching covers: ${checked}/${missing.length} checked, ${saved} saved...`;
      const batch=missing.slice(offset,offset+10);
      let results=[];
      try{results=await window.MIYUU_COVERS.search(batch);}
      catch(error){warnings.add('Open Library was unavailable; its matches were skipped.');}
      for(const book of batch){
        if(!session||session.user.id!==owner)throw Error('Search stopped because you signed out.');
        let cover=window.MIYUU_COVERS.match(book,results),fromGoogle=false;
        if(!cover&&googleKey){
          $('#coverStatus').textContent=`Trying Google Books for ${book.title} (${checked+1}/${missing.length})...`;
          try{cover=await window.MIYUU_COVERS.google(book,googleKey);fromGoogle=!!cover;}
          catch(error){warnings.add(error.message||'Google Books is unavailable.');googleKey='';}
          await new Promise(resolve=>setTimeout(resolve,350));
        }
        if(!session||session.user.id!==owner)throw Error('Search stopped because you signed out.');
        if(cover){
          const {data,error}=await supabaseClient.from('books').update({cover_url:cover}).eq('book_key',book.key).select('book_key');
          if(error)throw error;
          if(!data?.length)throw Error('Cover could not be saved. Check your database write permissions.');
          book.cover=cover;saved++;if(fromGoogle)googleSaved++;
        }
        checked++;
      }
      render();
      $('#coverStatus').textContent=`Searching covers: ${checked}/${missing.length} checked, ${saved} saved...`;
      if(offset+10<missing.length)await new Promise(resolve=>setTimeout(resolve,1100));
    }
    $('#coverStatus').textContent=`Finished: ${saved} covers saved (${googleSaved} from Google Books). ${missing.length-saved} books remain without saved covers. Covers may show a different edition. ${[...warnings].join(' ')}`;
  }catch(error){$('#coverStatus').textContent=`Saved ${saved} covers before stopping: ${error.message||error}. You can retry; saved covers are kept.`;}
  finally{findingCovers=false;$('#findCovers').disabled=false;$('#importCsv').disabled=false;}
};

init();