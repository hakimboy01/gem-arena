const board=document.getElementById('board'),statusEl=document.getElementById('status'),scoreEl=document.getElementById('score'),coinsEl=document.getElementById('coins');
const types=['🔴','🔵','🟢','🟣','🟡','🔶']; let cells=[],selected=null,score=0,coins=1210;
function rnd(){return Math.floor(Math.random()*types.length)}
function init(){cells=Array.from({length:64},rnd); while(findMatches().size) cells=Array.from({length:64},rnd); render()}
function render(){board.innerHTML='';cells.forEach((t,i)=>{const b=document.createElement('button');b.className='gem';b.textContent=types[t];b.onclick=()=>pick(i,b);board.appendChild(b)})}
function adjacent(a,b){return Math.abs(a-b)===1&&Math.floor(a/8)===Math.floor(b/8)||Math.abs(a-b)===8}
function pick(i,el){if(selected===null){selected=i;el.classList.add('selected');return}if(selected===i){selected=null;render();return}if(!adjacent(selected,i)){selected=i;render();document.querySelectorAll('.gem')[i].classList.add('selected');return}swap(selected,i);const m=findMatches();if(m.size){selected=null;clearMatches(m)}else{swap(selected,i);selected=null;statusEl.textContent='Pertukaran itu belum menghasilkan Match 3.';render()}}
function swap(a,b){[cells[a],cells[b]]=[cells[b],cells[a]]}
function findMatches(){const m=new Set();for(let r=0;r<8;r++){for(let c=0;c<8;){let s=c,v=cells[r*8+c];while(c<8&&cells[r*8+c]===v)c++;if(c-s>=3)for(let x=s;x<c;x++)m.add(r*8+x)}}for(let c=0;c<8;c++){for(let r=0;r<8;){let s=r,v=cells[r*8+c];while(r<8&&cells[r*8+c]===v)r++;if(r-s>=3)for(let x=s;x<r;x++)m.add(x*8+c)}}return m}
function clearMatches(m){score+=m.size*10;coins+=Math.floor(m.size/3);scoreEl.textContent=score;coinsEl.textContent=coins;statusEl.textContent='✨ '+m.size+' permata pecah! Combo berhasil.';m.forEach(i=>cells[i]=null);for(let c=0;c<8;c++){let col=[];for(let r=7;r>=0;r--)if(cells[r*8+c]!==null)col.push(cells[r*8+c]);for(let r=7,k=0;r>=0;r--,k++)cells[r*8+c]=k<col.length?col[k]:rnd()}render();setTimeout(()=>{const n=findMatches();if(n.size)clearMatches(n)},180)}
document.getElementById('shuffle').onclick=()=>{cells=Array.from({length:64},rnd);selected=null;statusEl.textContent='🔀 Papan diacak!';render()};
const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
function show(t,h){title.textContent=t;body.innerHTML=h;modal.classList.remove('hidden')}
document.getElementById('close').onclick=()=>modal.classList.add('hidden');
document.getElementById('rules').onclick=()=>show('📖 Rules','<p>Tukar dua gem yang bersebelahan untuk membuat baris atau kolom minimal 3 gem sama.</p><p>Match lebih besar akan menjadi dasar untuk Booster pada versi berikutnya.</p>');
document.getElementById('shop').onclick=()=>show('🛒 Gem Shop','<div class="shopItem">💣 Bomb Booster <button onclick="buy(100)">100 🪙</button></div><div class="shopItem">⚡ Lightning <button onclick="buy(150)">150 🪙</button></div><div class="shopItem">🎁 Starter Pack <button onclick="buy(250)">250 🪙</button></div>');
function buy(n){if(coins<n){statusEl.textContent='🪙 Koin belum cukup.';modal.classList.add('hidden');return}coins-=n;coinsEl.textContent=coins;statusEl.textContent='🎉 Item berhasil dibeli!';modal.classList.add('hidden')}
document.getElementById('sound').onclick=()=>{statusEl.textContent='🔊 Sistem suara akan memakai aset audio asli pada build berikutnya.'};init();