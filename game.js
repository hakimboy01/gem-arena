const board=document.getElementById('board'),statusEl=document.getElementById('status'),scoreEl=document.getElementById('score'),coinsEl=document.getElementById('coins');
const comboText=document.getElementById('comboText'),comboFill=document.getElementById('comboFill'),fx=document.getElementById('fxLayer');
const types=['🔴','🔵','🟢','🟣','🟡','🔶']; const N=8;
let cells=[],selected=null,score=0,coins=1210,combo=1,busy=false,soundOn=true,activeBooster=null;
const boosters={bomb:0,lightning:0,rainbow:0};

function rnd(){return Math.floor(Math.random()*types.length)}
function init(){cells=Array.from({length:64},rnd);while(findMatches().size)cells=Array.from({length:64},rnd);render();updateUI()}
function render(){board.innerHTML='';cells.forEach((t,i)=>{const b=document.createElement('button');b.className='gem drop';b.textContent=types[t];b.dataset.i=i;b.onclick=()=>pick(i,b);board.appendChild(b)})}
function updateUI(){scoreEl.textContent=score;coinsEl.textContent=coins;comboText.textContent='x'+combo;comboFill.style.width=Math.min(100,combo*18)+'%';Object.keys(boosters).forEach(k=>document.getElementById(k+'Count').textContent=boosters[k]);document.querySelectorAll('.booster').forEach(b=>b.classList.toggle('active',b.dataset.booster===activeBooster))}
function adjacent(a,b){return (Math.abs(a-b)===1&&Math.floor(a/N)===Math.floor(b/N))||Math.abs(a-b)===N}
function pick(i,el){
 if(busy)return;
 if(activeBooster){useBooster(i);return}
 if(selected===null){selected=i;el.classList.add('selected');return}
 if(selected===i){selected=null;render();return}
 if(!adjacent(selected,i)){selected=i;render();document.querySelectorAll('.gem')[i].classList.add('selected');return}
 const a=selected;swap(a,i);const m=findMatches();
 if(m.size){selected=null;resolveMatches(m,a,i)}else{swap(a,i);selected=null;statusEl.textContent='❌ Belum ada Match 3. Coba langkah lain!';combo=1;updateUI();render()}
}
function swap(a,b){[cells[a],cells[b]]=[cells[b],cells[a]]}
function findMatches(){
 const m=new Set();
 for(let r=0;r<N;r++){for(let c=0;c<N;){let s=c,v=cells[r*N+c];while(c<N&&cells[r*N+c]===v)c++;if(c-s>=3)for(let x=s;x<c;x++)m.add(r*N+x)}}
 for(let c=0;c<N;c++){for(let r=0;r<N;){let s=r,v=cells[r*N+c];while(r<N&&cells[r*N+c]===v)r++;if(r-s>=3)for(let x=s;x<r;x++)m.add(x*N+c)}}
 return m
}
async function resolveMatches(m,a,b){
 busy=true;combo=Math.min(combo+1,8);const count=m.size;score+=count*10*combo;coins+=Math.max(1,Math.floor(count/3));statusEl.textContent='✨ COMBO x'+combo+'! '+count+' gem meledak!';updateUI();sound('match');burst(m);
 if(count>=6){boosters.rainbow++;statusEl.textContent='🌈 MEGA MATCH! Rainbow Booster didapat!'}
 else if(count>=5){boosters.lightning++;statusEl.textContent='⚡ SUPER MATCH! Lightning Booster didapat!'}
 else if(count>=4){boosters.bomb++;statusEl.textContent='💣 Match 4! Bomb Booster didapat!'}
 updateUI();await wait(360);m.forEach(i=>cells[i]=null);collapse();render();await wait(260);
 const next=findMatches();if(next.size){await resolveMatches(next,-1,-1)}else{busy=false;combo=1;updateUI();statusEl.textContent='🎯 Giliranmu! Buat Match 3 dan kejar combo.'}
}
function collapse(){for(let c=0;c<N;c++){const col=[];for(let r=N-1;r>=0;r--){let v=cells[r*N+c];if(v!==null)col.push(v)}for(let r=N-1,k=0;r>=0;r--,k++)cells[r*N+c]=k<col.length?col[k]:rnd()}}
function burst(indices){indices.forEach(i=>{const el=document.querySelector('.gem[data-i="'+i+'"]');if(el)el.classList.add('pop');for(let n=0;n<3;n++){const p=document.createElement('span');p.className='particle';p.textContent=['✦','✨','💥'][n];const rect=el?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0,height:0};p.style.left=rect.left+rect.width/2+'px';p.style.top=rect.top+rect.height/2+'px';p.style.setProperty('--x',(Math.random()*120-60)+'px');p.style.setProperty('--y',(Math.random()*120-60)+'px');fx.appendChild(p);setTimeout(()=>p.remove(),800)}})}
function flash(){const f=document.createElement('div');f.className='screenFlash';fx.appendChild(f);setTimeout(()=>f.remove(),350)}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
document.querySelectorAll('.booster').forEach(btn=>btn.onclick=()=>{if(busy)return;const k=btn.dataset.booster;if(!boosters[k]){statusEl.textContent='🔒 Booster belum ada. Dapatkan dari Match 4, 5, atau 6!';return}activeBooster=activeBooster===k?null:k;statusEl.textContent=activeBooster?'🎯 Pilih gem target untuk '+activeBooster+'!':'🎮 Booster dibatalkan.';updateUI()})
async function useBooster(i){
 const kind=activeBooster;if(!boosters[kind]||busy)return;busy=true;activeBooster=null;boosters[kind]--;updateUI();flash();
 let targets=new Set();
 if(kind==='bomb'){const r=Math.floor(i/N),c=i%N;for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(y>=0&&y<N&&x>=0&&x<N)targets.add(y*N+x);statusEl.textContent='💣 BOOM! Bomb menghancurkan area!';sound('bomb')}
 if(kind==='lightning'){const c=i%N;for(let r=0;r<N;r++)targets.add(r*N+c);statusEl.textContent='⚡ LIGHTNING! Satu kolom disambar!';sound('lightning')}
 if(kind==='rainbow'){const type=cells[i];cells.forEach((v,x)=>{if(v===type)targets.add(x)});statusEl.textContent='🌈 RAINBOW! Semua gem sejenis dihancurkan!';sound('rainbow')}
 burst(targets);score+=targets.size*15;coins+=Math.max(1,Math.floor(targets.size/4));updateUI();await wait(420);targets.forEach(x=>cells[x]=null);collapse();render();await wait(250);const m=findMatches();busy=false;if(m.size)resolveMatches(m,-1,-1);else{combo=1;updateUI()}
}
document.getElementById('shuffle').onclick=()=>{if(busy)return;cells=Array.from({length:64},rnd);while(findMatches().size)cells=Array.from({length:64},rnd);selected=null;combo=1;statusEl.textContent='🔀 Papan diacak! Strategi baru dimulai.';render();updateUI();sound('shuffle')};
const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
function show(t,h){title.textContent=t;body.innerHTML=h;modal.classList.remove('hidden')}
document.getElementById('close').onclick=()=>modal.classList.add('hidden');
document.getElementById('rules').onclick=()=>show('📖 Gem Arena Rules','<p><b>Match 3</b> untuk skor dan koin.</p><p>💣 <b>Match 4</b> memberi Bomb Booster.</p><p>⚡ <b>Match 5</b> memberi Lightning Booster.</p><p>🌈 <b>Match 6+</b> memberi Rainbow Booster.</p><p>Booster dapat dipilih lalu gunakan pada gem target.</p>');
document.getElementById('shop').onclick=()=>show('🛒 Gem Shop','<div class="shopItem">💣 Bomb Booster <button onclick="buy(100,\'bomb\')">100 🪙</button></div><div class="shopItem">⚡ Lightning <button onclick="buy(150,\'lightning\')">150 🪙</button></div><div class="shopItem">🌈 Rainbow <button onclick="buy(250,\'rainbow\')">250 🪙</button></div>');
function buy(n,k){if(coins<n){statusEl.textContent='🪙 Koin belum cukup.';modal.classList.add('hidden');return}coins-=n;boosters[k]++;updateUI();statusEl.textContent='🎉 '+k+' berhasil dibeli!';modal.classList.add('hidden');sound('buy')}
let audioCtx;
function sound(kind){if(!soundOn)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();const map={match:[520,.09],bomb:[90,.25],lightning:[880,.2],rainbow:[660,.28],shuffle:[330,.12],buy:[740,.15]};const [freq,dur]=map[kind]||[440,.1];o.frequency.value=freq;o.type=kind==='bomb'?'sawtooth':'sine';g.gain.setValueAtTime(.08,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}}
document.getElementById('sound').onclick=()=>{soundOn=!soundOn;document.getElementById('sound').textContent=soundOn?'🔊':'🔇';statusEl.textContent=soundOn?'🔊 Suara aktif.':'🔇 Suara dimatikan.'};
init();