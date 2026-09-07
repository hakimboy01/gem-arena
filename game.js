const N=7;
const types=['🔷','🔴','🟢','🟣','🟡','🔶'];
const board=document.getElementById('board');
const statusEl=document.getElementById('status');
let cells=[],selected=null,busy=false,turn='player',moves=3,round=1,combo=1,timer=20,timerId=null;
let playerHP=100,enemyHP=100;
let soundOn=localStorage.getItem('gaSound')!=='0';
let musicOn=localStorage.getItem('gaMusic')!=='0';
let volume=Number(localStorage.getItem('gaVolume')||70);
let activeTool=null;
let tools=JSON.parse(localStorage.getItem('gaTools')||'{"bomb":2,"lightning":2,"rainbow":2}');

function save(){localStorage.setItem('gaTools',JSON.stringify(tools));localStorage.setItem('gaSound',soundOn?'1':'0');localStorage.setItem('gaMusic',musicOn?'1':'0');localStorage.setItem('gaVolume',volume)}
function rnd(){return Math.floor(Math.random()*types.length)}
function adjacent(a,b){let ar=Math.floor(a/N),ac=a%N,br=Math.floor(b/N),bc=b%N;return Math.abs(ar-br)+Math.abs(ac-bc)===1}
function findMatches(arr=cells){
 const hit=new Set();
 for(let r=0;r<N;r++){let run=1;for(let c=1;c<=N;c++){if(c<N&&arr[r*N+c]===arr[r*N+c-1])run++;else{if(run>=3)for(let k=c-run;k<c;k++)hit.add(r*N+k);run=1}}}
 for(let c=0;c<N;c++){let run=1;for(let r=1;r<=N;r++){if(r<N&&arr[r*N+c]===arr[(r-1)*N+c])run++;else{if(run>=3)for(let k=r-run;k<r;k++)hit.add(k*N+c);run=1}}}
 return hit
}
function freshBoard(){cells=Array.from({length:N*N},rnd);while(findMatches(cells).size)cells=Array.from({length:N*N},rnd)}
function render(){
 board.innerHTML='';
 cells.forEach((t,i)=>{const b=document.createElement('button');b.className='gem';b.textContent=types[t];b.dataset.i=i;b.addEventListener('click',()=>pick(i,b));board.appendChild(b)})
}
function pick(i,el){
 if(busy||turn!=='player')return;
 if(activeTool){useTool(i);return}
 if(selected===null){selected=i;el.classList.add('selected');return}
 if(selected===i){selected=null;el.classList.remove('selected');return}
 if(!adjacent(selected,i)){document.querySelector('.gem[data-i="'+selected+'"]')?.classList.remove('selected');selected=i;el.classList.add('selected');return}
 swap(selected,i);selected=null;resolveMove()
}
function swap(a,b){[cells[a],cells[b]]=[cells[b],cells[a]]}
function resolveMove(){
 const hit=findMatches();
 if(!hit.size){statusEl.textContent='❌ Harus membuat Match 3.';render();return}
 busy=true;stopTimer();hit.forEach(i=>document.querySelector('.gem[data-i="'+i+'"]')?.classList.add('pop'));
 const damage=Math.min(24,hit.size*3+combo*2);
 setTimeout(()=>{
   hit.forEach(i=>cells[i]=null);
   collapse();combo++;damageEnemy(damage);moves--;render();
   if(enemyHP<=0)return win();
   if(moves<=0)endTurn();else{busy=false;statusEl.textContent='✨ Match! Kamu masih punya '+moves+' jalan.';startTimer()}
 },280)
}
function collapse(){
 for(let c=0;c<N;c++){let col=[];for(let r=N-1;r>=0;r--){let v=cells[r*N+c];if(v!==null)col.push(v)}
 for(let r=N-1,k=0;r>=0;r--,k++)cells[r*N+c]=k<col.length?col[k]:rnd()}
}
function damageEnemy(d){enemyHP=Math.max(0,enemyHP-d);updateUI();beep(620)}
function damagePlayer(d){playerHP=Math.max(0,playerHP-d);updateUI();beep(180)}
function endTurn(){
 stopTimer();selected=null;
 if(turn==='player'){turn='enemy';moves=3;statusEl.textContent='🧙 Giliran lawan!';updateUI();setTimeout(enemyPlay,650)}
 else{turn='player';moves=3;round++;combo=1;statusEl.textContent='🎯 Giliranmu! 3 jalan tersedia.';updateUI();startTimer()}
}
function enemyPlay(){
 if(enemyHP<=0||playerHP<=0)return;
 const d=6+Math.floor(Math.random()*8);damagePlayer(d);moves--;
 if(playerHP<=0)return lose();
 if(moves<=0){endTurn()}else setTimeout(enemyPlay,550);
 updateUI()
}
function startTimer(){stopTimer();timer=20;updateUI();timerId=setInterval(()=>{timer--;updateUI();if(timer<=0){stopTimer();statusEl.textContent='⌛ Waktu habis! Giliran berganti.';endTurn()}},1000)}
function stopTimer(){clearInterval(timerId);timerId=null}
function updateUI(){
 document.getElementById('playerHp').style.width=playerHP+'%';document.getElementById('enemyHp').style.width=enemyHP+'%';
 document.getElementById('playerHpText').textContent=playerHP+'/100';document.getElementById('enemyHpText').textContent=enemyHP+'/100';
 document.getElementById('movesText').textContent=moves+' / 3';document.getElementById('roundText').textContent='ROUND '+round;
 document.getElementById('turnText').textContent=turn==='player'?'YOUR TURN':'OPPONENT TURN';
 document.getElementById('timerText').textContent=timer;
 document.getElementById('comboText').textContent='x'+combo;
 ['bomb','lightning','rainbow'].forEach(k=>{document.getElementById(k+'Count').textContent=tools[k];document.querySelector('[data-tool="'+k+'"]').disabled=tools[k]<=0});
 document.getElementById('musicQuick').textContent='🎵 Musik: '+(musicOn?'ON':'OFF');
 document.getElementById('soundQuick').textContent='🔊 Sound: '+(soundOn?'ON':'OFF');
 document.getElementById('volumeQuick').textContent='🔉 '+volume+'%';
 save()
}
function useTool(i){
 if(!activeTool||tools[activeTool]<=0)return;
 busy=true;stopTimer();
 if(activeTool==='bomb'){
   let r=Math.floor(i/N),c=i%N;for(let rr=Math.max(0,r-1);rr<=Math.min(N-1,r+1);rr++)for(let cc=Math.max(0,c-1);cc<=Math.min(N-1,c+1);cc++)cells[rr*N+cc]=rnd();
 }else if(activeTool==='lightning'){
   let r=Math.floor(i/N);for(let c=0;c<N;c++)cells[r*N+c]=rnd();
 }else{
   const color=cells[i];cells=cells.map(v=>v===color?rnd():v);
 }
 tools[activeTool]--;activeTool=null;busy=false;render();damageEnemy(14);statusEl.textContent='✨ Alat bantu dipakai!';updateUI();startTimer();beep(820)
}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{if(turn!=='player'||busy)return;activeTool=b.dataset.tool;document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));b.classList.add('active');statusEl.textContent='Pilih gem untuk memakai '+activeTool+'.'});
function win(){stopTimer();busy=true;show('🏆 MENANG!','<div class="modeCard"><b>Booster tetap utuh.</b><p>Kamu menang, jadi alat bantu yang masih tersisa tidak dihapus.</p><button onclick="restartGame()">▶ Main Lagi</button></div>')}
function lose(){stopTimer();busy=true;Object.keys(tools).forEach(k=>tools[k]=0);updateUI();show('💔 KALAH','<div class="modeCard"><b>Booster habis karena kalah.</b><p>Kamu bisa mendapatkan alat lagi dengan pembelian atau Rewarded Ad.</p><button onclick="watchAd()">📺 Tonton iklan +1 alat</button><button onclick="restartGame()">🔄 Coba Lagi</button></div>')}
window.restartGame=()=>{playerHP=100;enemyHP=100;round=1;turn='player';moves=3;combo=1;busy=false;activeTool=null;freshBoard();render();hide();statusEl.textContent='🎯 Buat Match 3 untuk menyerang!';updateUI();startTimer()}
function beep(freq){if(!soundOn)return;try{let C=window.AudioContext||window.webkitAudioContext;let c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;g.gain.value=volume/2000;o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.07)}catch(e){}}
const modal=document.getElementById('modal'),modalTitle=document.getElementById('modalTitle'),modalBody=document.getElementById('modalBody');
function show(t,h){modalTitle.textContent=t;modalBody.innerHTML=h;modal.classList.remove('hidden')}
function hide(){modal.classList.add('hidden')}
document.getElementById('closeModal').onclick=hide;
function openSettings(){show('⚙️ Pengaturan',`<div class="settingRow"><b>← Tombol kembali</b><span>Aktif</span></div><div class="settingRow"><b>🔉 Volume</b><input id="volRange" type="range" min="0" max="100" value="${volume}"></div><div class="settingRow"><b>🎵 Musik</b><button onclick="toggleMusic()">${musicOn?'ON':'OFF'}</button></div><div class="settingRow"><b>🔊 Sound</b><button onclick="toggleSound()">${soundOn?'ON':'OFF'}</button></div><div class="modeCard"><small>Pengaturan dibuat dalam satu panel agar hemat tempat di layar HP.</small></div>`);setTimeout(()=>{let r=document.getElementById('volRange');if(r)r.oninput=e=>{volume=+e.target.value;updateUI()}},0)}
window.toggleMusic=()=>{musicOn=!musicOn;save();openSettings();updateUI()}
window.toggleSound=()=>{soundOn=!soundOn;save();openSettings();updateUI()}
document.getElementById('settingsBtn').onclick=openSettings;
document.getElementById('musicQuick').onclick=window.toggleMusic;document.getElementById('soundQuick').onclick=window.toggleSound;
document.getElementById('volumeQuick').onclick=openSettings;
document.getElementById('buyToolBtn').onclick=()=>show('🪙 Beli Alat','<div class="modeCard"><b>Harga: setengah poin pertandingan (demo)</b><p>Prototype ini belum memakai sistem pembayaran nyata.</p><button onclick="refillTool()">➕ Isi ulang 1 alat</button></div>');
window.refillTool=()=>{let k=Object.keys(tools).sort((a,b)=>tools[a]-tools[b])[0];tools[k]=Math.min(2,tools[k]+1);hide();updateUI();statusEl.textContent='🪙 '+k+' ditambah 1.'}
document.getElementById('adToolBtn').onclick=()=>window.watchAd();
window.watchAd=()=>{let k=Object.keys(tools).sort((a,b)=>tools[a]-tools[b])[0];tools[k]=Math.min(2,tools[k]+1);hide();updateUI();statusEl.textContent='📺 Demo iklan selesai: +1 '+k+'.'}
document.getElementById('modeBtn').onclick=()=>show('⚔️ Mode Pertandingan','<div class="modeCard"><b>Battle Arena</b><small>Mode utama 1 vs 1, bergiliran 3 jalan.</small><button onclick="restartGame()">▶ Pilih Battle Arena</button></div><div class="modeCard"><b>Blitz Arena</b><small>Rancangan mode cepat untuk update berikutnya.</small></div>');
document.getElementById('lobbyBtn').onclick=()=>show('🏠 Lobby','<div class="modeCard"><b>Lobby terpisah dari pertandingan.</b><p>Di versi ini tombol kembali membuka lobby sederhana agar layar pertandingan tetap fokus.</p><button onclick="hide()">Kembali</button></div>');
document.getElementById('profileBtn').onclick=()=>show('👤 Profile','<div class="modeCard"><b>Gem Player</b><p>Hero: 🐉 Dragon Dancer</p><p>Alat bantu disimpan di perangkat.</p></div>');
document.getElementById('backBtn').onclick=()=>document.getElementById('lobbyBtn').click();

freshBoard();render();updateUI();startTimer();
