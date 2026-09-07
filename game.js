const N=7, types=['🔷','🔴','🟢','🟣','🟡','🔶'];
const board=document.getElementById('board'), statusEl=document.getElementById('status');
let cells=[], selected=null,busy=false,turn='player',moves=3,maxMoves=3,round=1,combo=1,timer=20,timerId=null;
let playerHP=100,enemyHP=100,activeTool=null,mode='duel',arenaMoves=7,score=0;
let soundOn=localStorage.getItem('gaSound')!=='0', musicOn=localStorage.getItem('gaMusic')!=='0', volume=+(localStorage.getItem('gaVolume')||70);
let tools=JSON.parse(localStorage.getItem('gaTools')||'{"bomb":2,"lightning":2,"rainbow":2}');
let profile=JSON.parse(localStorage.getItem('gaProfile')||'{"rank":"Bronze","rp":0,"coin":1479,"wins":0,"losses":0,"emotes":["👋","😂"],"fish":0}');
let noAdsUntil=+(localStorage.getItem('gaNoAdsUntil')||0), audioCtx=null, musicTimer=null, touchStart=null;
// Tempo permainan dibuat lebih santai agar board mudah dibaca di HP.
const CLEAR_DELAY=520, DROP_DELAY=680, CASCADE_DELAY=760;
function save(){localStorage.setItem('gaTools',JSON.stringify(tools));localStorage.setItem('gaProfile',JSON.stringify(profile));localStorage.setItem('gaSound',soundOn?'1':'0');localStorage.setItem('gaMusic',musicOn?'1':'0');localStorage.setItem('gaVolume',volume);localStorage.setItem('gaNoAdsUntil',noAdsUntil)}
function rnd(){return Math.floor(Math.random()*types.length)}
function adjacent(a,b){let ar=~~(a/N),ac=a%N,br=~~(b/N),bc=b%N;return Math.abs(ar-br)+Math.abs(ac-bc)===1}
function findMatchInfo(arr=cells){
 const hit=new Set(), runs=[]; const hCells=new Set(),vCells=new Set();
 for(let r=0;r<N;r++){let s=0;for(let c=1;c<=N;c++){if(c<N&&arr[r*N+c]===arr[r*N+c-1])continue;let len=c-s;if(len>=3){let run=[];for(let k=s;k<c;k++){let i=r*N+k;hit.add(i);hCells.add(i);run.push(i)}runs.push({dir:'h',len,cells:run})}s=c}}
 for(let c=0;c<N;c++){let s=0;for(let r=1;r<=N;r++){if(r<N&&arr[r*N+c]===arr[(r-1)*N+c])continue;let len=r-s;if(len>=3){let run=[];for(let k=s;k<r;k++){let i=k*N+c;hit.add(i);vCells.add(i);run.push(i)}runs.push({dir:'v',len,cells:run})}s=r}}
 const intersections=[...hCells].filter(i=>vCells.has(i));
 return {hit,runs,intersection:intersections.length>0,max:Math.max(0,...runs.map(x=>x.len))}
}
function freshBoard(){cells=Array.from({length:N*N},rnd);while(findMatchInfo(cells).hit.size)cells=Array.from({length:N*N},rnd)}
function render(drop=false){board.innerHTML='';cells.forEach((t,i)=>{let b=document.createElement('button');b.className='gem'+(drop?' drop':'');b.textContent=types[t];b.dataset.i=i;b.addEventListener('click',()=>pick(i,b));board.appendChild(b)})}
function pick(i,el){unlockAudio();if(busy||turn!=='player')return;if(activeTool){useTool(i);return}if(selected===null){selected=i;el.classList.add('selected');return}if(selected===i){selected=null;el.classList.remove('selected');return}if(!adjacent(selected,i)){document.querySelector(`.gem[data-i="${selected}"]`)?.classList.remove('selected');selected=i;el.classList.add('selected');return}doSwap(selected,i)}
function doSwap(a,b){if(busy)return;unlockAudio();busy=true;stopTimer();selected=null;[cells[a],cells[b]]=[cells[b],cells[a]];sound('swap');render();let info=findMatchInfo();if(!info.hit.size){setTimeout(()=>{[cells[a],cells[b]]=[cells[b],cells[a]];render();busy=false;statusEl.textContent='❌ Geseran harus menghasilkan Match 3.';sound('bad');startTimer()},180);return}setTimeout(()=>resolveMatches(info,true),120)}
function resolveMatches(info,fromMove){
 const hit=info.hit;
 // Match 4, 5, dan bentuk L/T memberi Extra Move: jalan tidak dikurangi.
 const extra=info.max>=4||info.intersection.length>0;
 hit.forEach(i=>document.querySelector(`.gem[data-i="${i}"]`)?.classList.add('pop'));
 sound('explode');
 const dmg=Math.min(32,hit.size*3+combo*2);
 score+=hit.size*10;
 statusEl.textContent=`💥 ${hit.size} gem cocok! Board sedang runtuh...`;
 // Beri waktu lebih lama supaya pemain bisa melihat gem yang hancur.
 setTimeout(()=>{
   hit.forEach(i=>cells[i]=null);
   collapse();
   damageEnemy(dmg);
   combo++;
   render(true);
   statusEl.textContent='⬇️ Permata jatuh...';
   // Tunggu animasi jatuh selesai sebelum mencari cascade berikutnya.
   setTimeout(()=>{
     const cascade=findMatchInfo();
     if(cascade.hit.size){
       statusEl.textContent='✨ Cascade! Kombinasi berikutnya...';
       setTimeout(()=>resolveMatches(cascade,false),CASCADE_DELAY);
       return;
     }
     if(fromMove){
       if(extra){
         // Extra move = giliran tetap, tidak mengurangi jumlah jalan.
         statusEl.textContent=`🌟 EXTRA MOVE! Match ${info.max>=5?'5':info.intersection.length?'L/T':'4'} — kamu tetap bermain.`;
         toast('🌟 EXTRA MOVE! Giliranmu tetap lanjut');
         sound('extra');
       }else{
         moves=Math.max(0,moves-1);
       }
     }
     updateUI();
     if(enemyHP<=0)return win();
     busy=false;
     if(moves<=0)endTurn();
     else{
       if(!extra)statusEl.textContent='✨ Match berhasil! Geser lagi dengan santai.';
       startTimer();
     }
   },DROP_DELAY);
 },CLEAR_DELAY)
}
function collapse(){for(let c=0;c<N;c++){let col=[];for(let r=N-1;r>=0;r--){let v=cells[r*N+c];if(v!==null)col.push(v)}for(let r=N-1,k=0;r>=0;r--,k++)cells[r*N+c]=k<col.length?col[k]:rnd()}}
function damageEnemy(d){enemyHP=Math.max(0,enemyHP-d);updateUI()}function damagePlayer(d){playerHP=Math.max(0,playerHP-d);updateUI();sound('hurt')}
function endTurn(){stopTimer();selected=null;if(mode==='arena'){arenaNext();return}if(turn==='player'){turn='enemy';moves=3;statusEl.textContent='🧙 Opponent Turn!';updateUI();announce('Opponent turn');sound('turn');setTimeout(enemyPlay,700)}else{turn='player';moves=3;round++;combo=1;statusEl.textContent='🎯 Your Turn! 3 jalan tersedia.';updateUI();announce('Your turn');sound('turn');startTimer()}}
function enemyPlay(){if(enemyHP<=0||playerHP<=0)return;let d=6+Math.floor(Math.random()*8);damagePlayer(d);moves--;if(playerHP<=0)return lose();if(moves<=0){endTurn()}else setTimeout(enemyPlay,550);updateUI()}
function arenaNext(){arenaMoves--;if(arenaMoves<=0){finishArena();return}moves=arenaMoves;statusEl.textContent=`👥 Arena: kamu masih punya ${arenaMoves} jalan. Kumpulkan poin sebanyak mungkin!`;busy=false;startTimer();updateUI()}
function finishArena(){stopTimer();let rivals=Array.from({length:9},(_,i)=>({n:'Player '+(i+2),p:Math.floor(score*(.45+Math.random()*.75))}));let all=[{n:'You',p:score},...rivals].sort((a,b)=>b.p-a.p);let pos=all.findIndex(x=>x.n==='You')+1;if(pos<=3){profile.coin+=pos===1?300:150;profile.rp+=pos===1?60:30;rankUp()}show('🏆 Arena Selesai',`<div class="modeCard"><b>Posisi #${pos}</b><p>Skor kamu: ${score}</p><ol class="arenaList">${all.map(x=>`<li>${x.n} — <b>${x.p}</b> poin</li>`).join('')}</ol><button onclick="restartGame()">▶ Main Lagi</button></div>`)}
function startTimer(){stopTimer();timer=20;updateUI();timerId=setInterval(()=>{timer--;updateUI();if(timer<=0){stopTimer();statusEl.textContent='⌛ Waktu habis! Giliran berganti.';endTurn()}},1000)}function stopTimer(){clearInterval(timerId);timerId=null}
function updateUI(){document.getElementById('playerHp').style.width=playerHP+'%';document.getElementById('enemyHp').style.width=enemyHP+'%';document.getElementById('playerHpText').textContent=playerHP+'/100';document.getElementById('enemyHpText').textContent=enemyHP+'/100';document.getElementById('movesText').textContent=mode==='arena'?arenaMoves+' / 7':moves+' / '+maxMoves;document.getElementById('roundText').textContent=mode==='arena'?'ARENA 10':'ROUND '+round;document.getElementById('turnText').textContent=mode==='arena'?'POINT RACE':turn==='player'?'YOUR TURN':'OPPONENT TURN';document.getElementById('timerText').textContent=timer;document.getElementById('comboText').textContent='x'+combo;['bomb','lightning','rainbow'].forEach(k=>{document.getElementById(k+'Count').textContent=tools[k];document.querySelector(`[data-tool="${k}"]`).disabled=tools[k]<=0});save()}
function useTool(i){if(!activeTool||tools[activeTool]<=0)return;busy=true;stopTimer();if(activeTool==='bomb'){let r=~~(i/N),c=i%N;for(let rr=Math.max(0,r-1);rr<=Math.min(N-1,r+1);rr++)for(let cc=Math.max(0,c-1);cc<=Math.min(N-1,c+1);cc++)cells[rr*N+cc]=rnd()}else if(activeTool==='lightning'){let r=~~(i/N);for(let c=0;c<N;c++)cells[r*N+c]=rnd()}else{let color=cells[i];cells=cells.map(v=>v===color?rnd():v)}tools[activeTool]--;activeTool=null;busy=false;render(true);damageEnemy(14);score+=50;statusEl.textContent='✨ Alat bantu dipakai!';updateUI();startTimer();sound('tool')}
document.querySelectorAll('.tool').forEach(b=>b.onclick=()=>{if(turn!=='player'||busy)return;activeTool=b.dataset.tool;document.querySelectorAll('.tool').forEach(x=>x.classList.remove('active'));b.classList.add('active');statusEl.textContent='Pilih permata untuk memakai '+activeTool+'.'});
function rankUp(){let old=profile.rank;if(profile.rp>=3000)profile.rank='Diamond';else if(profile.rp>=1500)profile.rank='Gold';else if(profile.rp>=500)profile.rank='Silver';else profile.rank='Bronze';if(old!==profile.rank){let reward=profile.rank==='Silver'?'😎':profile.rank==='Gold'?'🔥':'👑';profile.emotes.push(reward);toast('🏆 Rank naik ke '+profile.rank+'! Emote baru '+reward)}save()}
function win(){stopTimer();busy=true;profile.wins++;profile.rp+=50;profile.coin+=100;rankUp();sound('win');show('🏆 MENANG!',`<div class="modeCard"><b>+50 Rank Point • +100 Coin</b><p>Rank sekarang: ${profile.rank} (${profile.rp} RP)</p><p>Booster tetap utuh karena kamu menang.</p><button onclick="restartGame()">▶ Main Lagi</button></div>`)}
function lose(){stopTimer();busy=true;profile.losses++;Object.keys(tools).forEach(k=>tools[k]=0);updateUI();show('💔 KALAH','<div class="modeCard"><b>Booster habis karena kalah.</b><p>Kamu bisa mendapat alat lagi dengan coin atau Rewarded Ad.</p><button onclick="watchAd()">📺 Tonton iklan +1 alat</button><button onclick="restartGame()">🔄 Coba Lagi</button></div>')}
window.restartGame=()=>{playerHP=100;enemyHP=100;round=1;turn='player';maxMoves=3;moves=mode==='arena'?7:3;arenaMoves=7;combo=1;score=0;busy=false;activeTool=null;freshBoard();render();hide();statusEl.textContent='🎯 Giliranmu! Geser permata untuk Match 3.';updateUI();announce('Your turn');startTimer()}
function ctx(){
  if(!audioCtx){
    const C=window.AudioContext||window.webkitAudioContext;
    if(C) audioCtx=new C();
  }
  return audioCtx;
}
function unlockAudio(){
  try{
    const c=ctx();
    if(c&&c.state==='suspended') c.resume().catch(()=>{});
  }catch(e){}
}
function playTone(f,d=.08,type='sine',channel='sound'){
  if(channel==='sound'&&!soundOn)return;
  if(channel==='music'&&!musicOn)return;
  try{
    const c=ctx();
    if(!c)return;
    if(c.state==='suspended'){c.resume().catch(()=>{});return;}
    const o=c.createOscillator(),g=c.createGain();
    o.type=type;
    o.frequency.setValueAtTime(f,c.currentTime);
    const base=Math.max(.0005,Math.min(.12,volume/(channel==='music'?2600:900)));
    g.gain.setValueAtTime(base,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0005,c.currentTime+d);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime+d+.02);
  }catch(e){}
}
function tone(f,d=.08,type='sine'){playTone(f,d,type,'sound')}
function sound(k){
  if(k==='swap')tone(520,.055,'sine');
  else if(k==='explode'){tone(190,.11,'square');setTimeout(()=>tone(720,.08,'triangle'),65)}
  else if(k==='extra'){tone(660,.09,'triangle');setTimeout(()=>tone(880,.13,'triangle'),85)}
  else if(k==='turn'){tone(440,.10,'triangle');setTimeout(()=>tone(620,.08,'triangle'),70)}
  else if(k==='hurt')tone(150,.10,'sawtooth');
  else if(k==='tool')tone(780,.11,'triangle');
  else if(k==='win'){tone(660,.10,'triangle');setTimeout(()=>tone(880,.16,'triangle'),95)}
  else tone(220,.05,'sine');
}
function announce(t){
  if(!soundOn||!('speechSynthesis'in window))return;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang='en-US';
    u.rate=.92;
    u.pitch=1;
    u.volume=Math.min(1,Math.max(0,volume/100));
    u.onerror=()=>{};
    speechSynthesis.speak(u);
  }catch(e){}
}
function musicStart(){
  if(!musicOn||musicTimer)return;
  let notes=[220,262,330,392,330,262],i=0;
  const beat=()=>{
    if(!musicOn){musicTimer=null;return;}
    playTone(notes[i++%notes.length],.14,'triangle','music');
    musicTimer=setTimeout(beat,820);
  };
  beat();
}
function musicStop(){
  if(musicTimer){clearTimeout(musicTimer);musicTimer=null}
}
const modal=document.getElementById('modal'),modalTitle=document.getElementById('modalTitle'),modalBody=document.getElementById('modalBody');function show(t,h){modalTitle.textContent=t;modalBody.innerHTML=h;modal.classList.remove('hidden')}function hide(){modal.classList.add('hidden')}document.getElementById('closeModal').onclick=hide;
function openSettings(){show('⚙️ Pengaturan',`<div class="settingRow"><b>← Tombol kembali</b><button onclick="hide()">Kembali</button></div><div class="settingRow"><b>🔉 Volume</b><input id="volRange" type="range" min="0" max="100" value="${volume}"></div><div class="settingRow"><b>🎵 Musik</b><button onclick="toggleMusic()">${musicOn?'ON':'OFF'}</button></div><div class="settingRow"><b>🔊 Sound</b><button onclick="toggleSound()">${soundOn?'ON':'OFF'}</button></div>`);setTimeout(()=>{let r=document.getElementById('volRange');if(r)r.oninput=e=>{volume=+e.target.value;save()}},0)}
window.toggleMusic=()=>{musicOn=!musicOn;musicOn?musicStart():musicStop();save();openSettings()};window.toggleSound=()=>{soundOn=!soundOn;save();openSettings()};document.getElementById('settingsBtn').onclick=openSettings;
function openLobby(){show('🏠 LOBBY',`<div class="modeCard"><b>👤 Gem Player • ${profile.rank}</b><p>🏆 ${profile.rp} RP • 🪙 ${profile.coin} Coin • 🐟 ${profile.fish} Ikan</p><div class="rankBar"><i style="width:${Math.min(100,(profile.rp%500)/5)}%"></i></div><p>Menang: ${profile.wins} • Kalah: ${profile.losses}</p></div><div class="modeCard"><b>🎒 Inventory</b><p>💣 ${tools.bomb}/2 • ⚡ ${tools.lightning}/2 • 🌈 ${tools.rainbow}/2</p><p>Emote: ${profile.emotes.join(' ')}</p></div><div class="modeCard"><b>😄 Emote</b><div class="emojiRow">${profile.emotes.map(e=>`<button onclick="sendEmote('${e}')">${e}</button>`).join('')}</div></div><div class="modeCard"><b>🚫 No Ads hemat</b><p>Rp1.000 = bebas iklan selama 1 jam.</p><p>${noAdsUntil>Date.now()<noAdsUntil?'Aktif sampai '+new Date(noAdsUntil).toLocaleTimeString('id-ID'):'Belum aktif'}</p><button onclick="buyNoAds()">💳 Aktifkan 1 Jam (Demo)</button></div>`)}
window.sendEmote=e=>{hide();toast(e+' dikirim ke lawan!')};window.buyNoAds=()=>{noAdsUntil=Date.now()+3600000;save();openLobby();toast('🚫 No Ads aktif 1 jam (demo)')};
function openModes(){show('⚔️ MODE PERMAINAN',`<div class="modeCard"><b>1️⃣ Duel 1 vs 1</b><p>3 jalan bergiliran, HP dan Rank Point.</p><button onclick="chooseMode('duel')">▶ Main Duel</button></div><div class="modeCard"><b>2️⃣ Arena 10 Pemain</b><p>10 pemain mengumpulkan poin. Kamu memiliki 7 jalan. Setelah habis tidak bisa jalan lagi. Poin tertinggi menang.</p><button onclick="chooseMode('arena')">▶ Masuk Arena</button></div>`)}
window.chooseMode=m=>{mode=m;document.getElementById('modeTitle').textContent=m==='arena'?'Battle Arena • 10 Players':'Battle Arena • Duel';restartGame()};
function openProfile(){show('👤 PROFILE',`<div class="modeCard"><b>🐉 Gem Player</b><p>Rank: ${profile.rank}</p><p>Rank Point: ${profile.rp}</p><p>Coin: 🪙 ${profile.coin}</p><p>🐟 Ikan: ${profile.fish}</p><p>Menang/Kalah: ${profile.wins}/${profile.losses}</p></div>`)}
document.getElementById('lobbyBtn').onclick=openLobby;document.getElementById('modeBtn').onclick=openModes;document.getElementById('profileBtn').onclick=openProfile;document.getElementById('backBtn').onclick=openLobby;
document.getElementById('buyToolBtn').onclick=()=>show('🪙 Beli Alat','<div class="modeCard"><b>Harga demo: 50 Coin per alat</b><button onclick="refillTool()">➕ Beli +1 alat</button></div>');window.refillTool=()=>{if(profile.coin<50){toast('Coin belum cukup');return}let k=Object.keys(tools).sort((a,b)=>tools[a]-tools[b])[0];if(tools[k]>=2){toast('Semua alat sudah penuh');return}profile.coin-=50;tools[k]++;hide();updateUI();toast('🪙 '+k+' +1')};
document.getElementById('adToolBtn').onclick=()=>watchAd();window.watchAd=()=>{if(Date.now()<noAdsUntil){toast('🚫 No Ads aktif: tidak perlu iklan');return}let k=Object.keys(tools).sort((a,b)=>tools[a]-tools[b])[0];tools[k]=Math.min(2,tools[k]+1);hide();updateUI();toast('📺 Demo iklan selesai: +1 '+k)};
board.addEventListener('touchstart',e=>{let g=e.target.closest('.gem');if(!g)return;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY,i:+g.dataset.i};},{passive:true});board.addEventListener('touchend',e=>{if(!touchStart)return;let dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))<18){touchStart=null;return}let r=~~(touchStart.i/N),c=touchStart.i%N,ni=touchStart.i;if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&c<N-1)ni++;if(dx<0&&c>0)ni--}else{if(dy>0&&r<N-1)ni+=N;if(dy<0&&r>0)ni-=N}if(ni!==touchStart.i&&!busy&&turn==='player'&&!activeTool)doSwap(touchStart.i,ni);touchStart=null},{passive:true});
function toast(t){let x=document.getElementById('toast');x.textContent=t;x.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>x.classList.remove('show'),1800)}
freshBoard();render();updateUI();startTimer();document.addEventListener('pointerdown',()=>{unlockAudio();musicStart()},{once:true});
