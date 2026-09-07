const board=document.getElementById('board'),statusEl=document.getElementById('status'),scoreEl=document.getElementById('score'),coinsEl=document.getElementById('coins');const comboText=document.getElementById('comboText'),comboFill=document.getElementById('comboFill'),fx=document.getElementById('fxLayer');
const types=['🛑','🔷','🟢','💜','🟨','🔶'],N=8;
const heroes=[
{id:'dragon',icon:'🐉',name:'Dragon Dancer',skill:'Dragon Storm',rarity:'LEGENDARY',desc:'Menghancurkan 12 gem acak.'},
{id:'mage',icon:'🧙',name:'Crystal Mage',skill:'Crystal Rain',rarity:'EPIC',desc:'Mengubah 10 gem menjadi satu warna.'},
{id:'warrior',icon:'⚔️',name:'Arena Warrior',skill:'Blade Line',rarity:'RARE',desc:'Menghancurkan satu baris dan kolom.'},
{id:'fairy',icon:'🧚',name:'Gem Fairy',skill:'Lucky Bloom',rarity:'EPIC',desc:'Memberi 2 booster acak.'},
{id:'robot',icon:'🤖',name:'Neon Bot',skill:'Overload',rarity:'RARE',desc:'Mengacak papan dan memberi bonus skor.'},
{id:'ranger',icon:'🏹',name:'Star Ranger',skill:'Star Shot',rarity:'LEGENDARY',desc:'Menghancurkan semua gem warna target.'}
];
let cells=[],selected=null,score=0,coins=Number(localStorage.getItem('gaCoins')||1210),combo=1,busy=false,soundOn=true,activeBooster=null,energy=0;
let heroId=localStorage.getItem('gaHero')||'dragon';
const boosters={bomb:0,lightning:0,rainbow:0};
let playerHP=100,enemyHP=100,round=1,mission=Number(localStorage.getItem('gaMission')||0),missionClaimed=localStorage.getItem('gaMissionClaimed')==='1';
const todayKey=()=>new Date().toISOString().slice(0,10);
let missionDate=localStorage.getItem('gaMissionDate')||todayKey();
if(missionDate!==todayKey()){mission=0;missionClaimed=false;missionDate=todayKey();}
let dailyDate=localStorage.getItem('gaDailyDate')||'';
let dailyStreak=Number(localStorage.getItem('gaDailyStreak')||0);
let lastChest=Number(localStorage.getItem('gaLastChest')||0);
const CHEST_COOLDOWN=4*60*60*1000;
const leagues=[
 {id:'bronze',name:'Bronze',icon:'🥉',min:0,next:100},
 {id:'silver',name:'Silver',icon:'🥈',min:100,next:250},
 {id:'gold',name:'Gold',icon:'🥇',min:250,next:500},
 {id:'diamond',name:'Diamond',icon:'💎',min:500,next:900},
 {id:'master',name:'Master',icon:'👑',min:900,next:Infinity}
];
let playerName=localStorage.getItem('gaPlayerName')||'Gem Player';
let rankPoints=Number(localStorage.getItem('gaRankPoints')||0);
let wins=Number(localStorage.getItem('gaWins')||0),losses=Number(localStorage.getItem('gaLosses')||0),highestScore=Number(localStorage.getItem('gaHighestScore')||0);
function currentLeague(){return [...leagues].reverse().find(l=>rankPoints>=l.min)||leagues[0]}
function rankProgress(){const l=currentLeague();return l.next===Infinity?100:Math.max(0,Math.min(100,(rankPoints-l.min)/(l.next-l.min)*100))}
function saveProfile(){localStorage.setItem('gaPlayerName',playerName);localStorage.setItem('gaRankPoints',rankPoints);localStorage.setItem('gaWins',wins);localStorage.setItem('gaLosses',losses);localStorage.setItem('gaHighestScore',highestScore);}

let mode='classic',enemyTimer=null,matchTimer=null;let quickOpponent=null;
const levels=[
 {id:1,world:'CRYSTAL GARDEN',icon:'🌿',enemy:'Garden Rogue',avatar:'🧙',hp:80,reward:40,xp:35,desc:'Arena pertama untuk memulai petualangan.'},
 {id:2,world:'NEON CAVE',icon:'💜',enemy:'Neon Miner',avatar:'🤖',hp:110,reward:60,xp:45,desc:'Kristal neon memberi tantangan baru.'},
 {id:3,world:'DRAGON TEMPLE',icon:'🐉',enemy:'Temple Guard',avatar:'⚔️',hp:145,reward:85,xp:60,desc:'Arena kuno dengan pertahanan kuat.'},
 {id:4,world:'FROZEN ARENA',icon:'❄️',enemy:'Ice Phantom',avatar:'👻',hp:180,reward:110,xp:75,desc:'Musuh lebih kuat di arena es.'},
 {id:5,world:'TITAN CITADEL',icon:'🏰',enemy:'Crystal Titan',avatar:'👹',hp:250,reward:180,xp:100,desc:'Boss utama wilayah pertama.'}
];
let levelId=Math.max(1,Number(localStorage.getItem('gaLevel')||1)),xp=Number(localStorage.getItem('gaXP')||0),campaign=true;
function currentLevel(){return levels.find(l=>l.id===levelId)||levels[0]}
const modes={
 classic:{name:'Classic Arena',enemy:'Crystal Rogue',avatar:'🧙',hp:100,reward:35,desc:'Pertarungan santai 1 lawan 1.'},
 blitz:{name:'Blitz Arena',enemy:'Neon Striker',avatar:'🤖',hp:120,reward:60,desc:'Musuh lebih agresif, hadiah lebih besar.'},
 boss:{name:'Boss Crystal',enemy:'Crystal Titan',avatar:'👹',hp:220,reward:120,desc:'Boss battle dengan hadiah besar.'}
};
function hero(){return heroes.find(h=>h.id===heroId)||heroes[0]}function rnd(){return Math.floor(Math.random()*types.length)}
function init(){cells=Array.from({length:64},rnd);while(findMatches().size)cells=Array.from({length:64},rnd);render();updateUI()}

// Kontrol Match-3 untuk HP: tap dua gem ATAU geser (swipe) satu gem ke arah gem tetangga.
let dragStart=null;
function render(){
  board.innerHTML='';
  cells.forEach((t,i)=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='gem drop';
    b.textContent=types[t];
    b.dataset.i=i;
    b.addEventListener('pointerdown',e=>startDrag(i,e));
    b.addEventListener('pointerup',e=>endDrag(i,e));
    b.addEventListener('pointercancel',cancelDrag);
    board.appendChild(b);
  });
}
function startDrag(i,e){
  if(busy)return;
  unlockAudio();
  dragStart={i,x:e.clientX,y:e.clientY};
  try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
}
function cancelDrag(){dragStart=null}
function endDrag(i,e){
  if(!dragStart||busy)return;
  const start=dragStart; dragStart=null;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;
  const threshold=14;
  if(Math.abs(dx)<threshold&&Math.abs(dy)<threshold){
    const el=document.querySelector('.gem[data-i="'+i+'"]');
    pick(i,el);
    return;
  }
  let target=start.i;
  if(Math.abs(dx)>Math.abs(dy)) target=start.i+(dx>0?1:-1);
  else target=start.i+(dy>0?N:-N);
  if(target<0||target>=N*N||!adjacent(start.i,target)){
    statusEl.textContent='↔️ Geser gem ke arah atas, bawah, kiri, atau kanan.';
    return;
  }
  moveGem(start.i,target);
}
function updateUI(){
scoreEl.textContent=score;coinsEl.textContent=coins;if(score>highestScore){highestScore=score;saveProfile();}localStorage.setItem('gaCoins',coins);comboText.textContent='x'+combo;comboFill.style.width=Math.min(100,combo*18)+'%';Object.keys(boosters).forEach(k=>document.getElementById(k+'Count').textContent=boosters[k]);document.querySelectorAll('.booster').forEach(b=>b.classList.toggle('active',b.dataset.booster===activeBooster));const h=hero();document.getElementById('heroName').textContent=h.icon+' '+h.name;document.getElementById('heroDesc').textContent='Skill: '+h.skill;document.getElementById('heroBtn').textContent=h.icon;document.getElementById('energyText').textContent=energy+'/100';document.getElementById('energyFill').style.width=energy+'%';const sb=document.getElementById('skillBtn');sb.disabled=energy<100;sb.classList.toggle('ready',energy>=100);sb.textContent=energy>=100?'✨ AKTIFKAN: '+h.skill:'🔒 KUMPULKAN ENERGY';
const p=Math.max(0,playerHP),e=Math.max(0,enemyHP);const arena=campaign?currentLevel():modes[mode];document.getElementById('playerHp').style.width=p+'%';document.getElementById('enemyHp').style.width=e+'%';document.getElementById('playerHpText').textContent=p+'/100';document.getElementById('enemyHpText').textContent=e+'/'+arena.hp;document.getElementById('roundText').textContent='ROUND '+round;document.getElementById('enemyName').textContent=arena.enemy;document.getElementById('enemyAvatar').textContent=arena.avatar;
const lv=currentLevel();document.getElementById('mapBadge').textContent=lv.icon;document.getElementById('worldName').textContent=lv.world;document.getElementById('levelName').textContent='LEVEL '+levelId;document.getElementById('xpText').textContent=xp+'/100';document.getElementById('xpFill').style.width=Math.min(100,xp)+'%';document.getElementById('missionText').textContent=mission+'/30 gem';document.getElementById('claimMission').disabled=mission<30||missionClaimed;document.getElementById('claimMission').textContent=missionClaimed?'✓ CLAIMED':mission>=30?'🎁 CLAIM 150':'🎁 150';
localStorage.setItem('gaMission',mission);localStorage.setItem('gaMissionClaimed',missionClaimed?'1':'0');localStorage.setItem('gaMissionDate',missionDate);localStorage.setItem('gaDailyDate',dailyDate);localStorage.setItem('gaDailyStreak',dailyStreak);localStorage.setItem('gaLastChest',lastChest);
const league=currentLeague();document.getElementById('profileAvatar').textContent=hero().icon;document.getElementById('profileName').textContent=playerName;document.getElementById('profileRank').textContent=league.icon+' '+league.name;document.getElementById('rankPoints').textContent=rankPoints+' RP';document.getElementById('rankFill').style.width=rankProgress()+'%';saveProfile();
const chestBtn=document.getElementById('chestBtn');if(chestBtn){const left=Math.max(0,CHEST_COOLDOWN-(Date.now()-lastChest));chestBtn.textContent=left?'⏳ Chest':'🎁 Chest';}
}
function gainEnergy(n){energy=Math.min(100,energy+n);updateUI()}
function adjacent(a,b){return(Math.abs(a-b)===1&&Math.floor(a/N)===Math.floor(b/N))||Math.abs(a-b)===N}
function pick(i,el){
  if(busy)return;
  unlockAudio();
  if(activeBooster){useBooster(i);return}
  if(selected===null){
    selected=i;
    if(el)el.classList.add('selected');
    statusEl.textContent='👆 Pilih atau geser ke gem tetangga.';
    return;
  }
  if(selected===i){selected=null;render();return}
  if(!adjacent(selected,i)){
    selected=i;render();
    const next=document.querySelector('.gem[data-i="'+i+'"]');
    if(next)next.classList.add('selected');
    return;
  }
  moveGem(selected,i);
}
function moveGem(a,b){
  if(busy)return;
  if(activeBooster){useBooster(b);return}
  selected=null;
  swap(a,b);
  const m=findMatches();
  render();
  if(m.size){
    statusEl.textContent='💥 MATCH! Gem dihancurkan!';
    sound('swap');
    setTimeout(()=>resolveMatches(m),90);
  }else{
    sound('invalid');
    setTimeout(()=>{
      swap(a,b);
      combo=1;
      statusEl.textContent='❌ Belum ada Match 3. Coba kombinasi lain!';
      updateUI();
      render();
    },140);
  }
}
function swap(a,b){[cells[a],cells[b]]=[cells[b],cells[a]]}
function findMatches(){const m=new Set();for(let r=0;r<N;r++)for(let c=0;c<N;){let s=c,v=cells[r*N+c];while(c<N&&cells[r*N+c]===v)c++;if(c-s>=3)for(let x=s;x<c;x++)m.add(r*N+x)}for(let c=0;c<N;c++)for(let r=0;r<N;){let s=r,v=cells[r*N+c];while(r<N&&cells[r*N+c]===v)r++;if(r-s>=3)for(let x=s;x<r;x++)m.add(x*N+c)}return m}
async function resolveMatches(m){busy=true;combo=Math.min(combo+1,8);const count=m.size;const damage=count*combo*2;score+=count*10*combo;coins+=Math.max(1,Math.floor(count/3));mission=Math.min(30,mission+count);enemyHP=Math.max(0,enemyHP-damage);gainEnergy(count*5);statusEl.textContent='✨ COMBO x'+combo+'! '+count+' gem meledak!';sound('match');burst(m);if(count>=6){boosters.rainbow++;statusEl.textContent='🌈 MEGA MATCH! Rainbow Booster didapat!'}else if(count>=5){boosters.lightning++;statusEl.textContent='⚡ SUPER MATCH! Lightning Booster didapat!'}else if(count>=4){boosters.bomb++;statusEl.textContent='💣 Match 4! Bomb Booster didapat!'}updateUI();await wait(360);m.forEach(i=>cells[i]=null);collapse();render();await wait(260);const next=findMatches();if(next.size){await resolveMatches(next)}else{busy=false;combo=1;updateUI();if(enemyHP<=0){victory();return}statusEl.textContent=energy>=100?'✨ Skill siap! Tekan tombol Skill!':'🎯 Bagus! Bersiap menghadapi serangan musuh.';enemyTurn()}}
function collapse(){for(let c=0;c<N;c++){const col=[];for(let r=N-1;r>=0;r--){const v=cells[r*N+c];if(v!==null)col.push(v)}for(let r=N-1,k=0;r>=0;r--,k++)cells[r*N+c]=k<col.length?col[k]:rnd()}}
function burst(indices){indices.forEach(i=>{const el=document.querySelector('.gem[data-i="'+i+'"]');if(el)el.classList.add('pop');for(let n=0;n<3;n++){const p=document.createElement('span');p.className='particle';p.textContent=['✦','✨','💥'][n];const rect=el?el.getBoundingClientRect():{left:innerWidth/2,top:innerHeight/2,width:0,height:0};p.style.left=rect.left+rect.width/2+'px';p.style.top=rect.top+rect.height/2+'px';p.style.setProperty('--x',(Math.random()*140-70)+'px');p.style.setProperty('--y',(Math.random()*140-70)+'px');fx.appendChild(p);setTimeout(()=>p.remove(),800)}})}
function flash(){const f=document.createElement('div');f.className='screenFlash';fx.appendChild(f);setTimeout(()=>f.remove(),350)}function wait(ms){return new Promise(r=>setTimeout(r,ms))}
document.querySelectorAll('.booster').forEach(btn=>btn.onclick=()=>{if(busy)return;const k=btn.dataset.booster;if(!boosters[k]){statusEl.textContent='🔒 Dapatkan dari Match 4, 5, atau 6!';return}activeBooster=activeBooster===k?null:k;statusEl.textContent=activeBooster?'🎯 Pilih gem target untuk '+activeBooster+'!':'🎮 Booster dibatalkan.';updateUI()})
async function useBooster(i){const kind=activeBooster;if(!boosters[kind]||busy)return;busy=true;activeBooster=null;boosters[kind]--;updateUI();flash();let targets=new Set();if(kind==='bomb'){const r=Math.floor(i/N),c=i%N;for(let y=r-1;y<=r+1;y++)for(let x=c-1;x<=c+1;x++)if(y>=0&&y<N&&x>=0&&x<N)targets.add(y*N+x);sound('bomb')}if(kind==='lightning'){const c=i%N;for(let r=0;r<N;r++)targets.add(r*N+c);sound('lightning')}if(kind==='rainbow'){const type=cells[i];cells.forEach((v,x)=>{if(v===type)targets.add(x)});sound('rainbow')}statusEl.textContent='💥 '+kind.toUpperCase()+' AKTIF!';burst(targets);score+=targets.size*15;gainEnergy(targets.size*3);updateUI();await clearTargets(targets);busy=false}
async function clearTargets(targets){await wait(420);targets.forEach(x=>cells[x]=null);collapse();render();await wait(250);const m=findMatches();if(m.size)resolveMatches(m);else{combo=1;updateUI();if(enemyHP<=0){busy=false;victory()}else{busy=false;enemyTurn()}}}
document.getElementById('skillBtn').onclick=async()=>{if(energy<100||busy)return;busy=true;energy=0;const h=hero();flash();statusEl.textContent='🌟 '+h.name+' menggunakan '+h.skill+'!';let targets=new Set();if(h.id==='dragon'){while(targets.size<12)targets.add(Math.floor(Math.random()*64))}if(h.id==='mage'){const color=rnd();let changed=0;cells.forEach((v,i)=>{if(changed<10&&Math.random()<.4){cells[i]=color;changed++}});render();await wait(180);targets=findMatches()}if(h.id==='warrior'){const r=Math.floor(Math.random()*N),c=Math.floor(Math.random()*N);for(let x=0;x<N;x++){targets.add(r*N+x);targets.add(x*N+c)}}if(h.id==='fairy'){const arr=['bomb','lightning','rainbow'];boosters[arr[rnd()]]++;boosters[arr[rnd()]]++;statusEl.textContent='🧚 Lucky Bloom memberi 2 booster!'}if(h.id==='robot'){cells=Array.from({length:64},rnd);while(findMatches().size)cells=Array.from({length:64},rnd);score+=250;render();statusEl.textContent='🤖 Overload! Papan diacak +250 skor!'}if(h.id==='ranger'){const color=cells[Math.floor(Math.random()*64)];cells.forEach((v,i)=>{if(v===color)targets.add(i)})}if(targets.size){burst(targets);score+=targets.size*25;coins+=Math.ceil(targets.size/3);await clearTargets(targets)}else{updateUI();busy=false}sound('rainbow')}
function enemyTurn(){if(playerHP<=0||enemyHP<=0)return;const arena=campaign?currentLevel():modes[mode];document.getElementById('turnText').textContent='MUSUH MENYERANG';statusEl.textContent='⚔️ '+arena.enemy+' sedang menyerang...';enemyTimer=setTimeout(()=>{const max=campaign?Math.min(26,10+levelId*4):(mode==='boss'?24:mode==='blitz'?18:14);const dmg=7+Math.floor(Math.random()*max);playerHP=Math.max(0,playerHP-dmg);document.querySelector('.battleHud').classList.add('damage');setTimeout(()=>document.querySelector('.battleHud').classList.remove('damage'),300);sound('bomb');updateUI();if(playerHP<=0){defeat();return}round++;document.getElementById('turnText').textContent='GILIRANMU';statusEl.textContent='🛡️ Kamu terkena '+dmg+' damage. Buat Match 3 untuk membalas!'},650)}
function victory(){clearTimeout(enemyTimer);busy=true;const arena=campaign?currentLevel():modes[mode];const reward=(arena.reward||modes[mode].reward)+round*5;const rp=campaign?15:(mode==='boss'?35:mode==='blitz'?25:20);wins++;rankPoints+=rp;coins+=reward;saveProfile();if(campaign){xp=Math.min(100,xp+arena.xp);let unlocked=false;if(levelId<levels.length){levelId++;unlocked=true}localStorage.setItem('gaLevel',levelId);localStorage.setItem('gaXP',xp);updateUI();sound('buy');show('🏆 LEVEL SELESAI!', '<div class="campaignWin"><div class="trophy">🏆</div><b>'+arena.world+' ditaklukkan!</b><small>Kamu mengalahkan '+arena.enemy+'.</small><div class="rewardGrid"><div class="rewardBox">🪙<b>'+reward+'</b>Coins</div><div class="rewardBox">⭐<b>+'+arena.xp+'</b>XP</div><div class="rewardBox">🗺️<b>'+(unlocked?'NEW':'MAX')+'</b>Level</div></div><p>🏆 +'+rp+' Rank Points • '+currentLeague().icon+' '+currentLeague().name+'</p><button class="nextLevel" onclick="restartBattle()">▶ '+(unlocked?'LANJUT LEVEL '+levelId:'MAIN LAGI')+'</button><button onclick="openMap()" style="margin-top:8px">🗺️ LIHAT MAP</button></div>');return}updateUI();sound('buy');show('🏆 MENANG!', '<div class="modeCard"><b>Victory!</b><small>Kamu mengalahkan '+arena.enemy+' pada Round '+round+'.</small><p>🪙 Reward: <b>'+reward+' coins</b></p><button onclick="restartBattle()">▶ MAIN LAGI</button></div>')}
function defeat(){clearTimeout(enemyTimer);busy=true;losses++;rankPoints=Math.max(0,rankPoints-(campaign?0:10));saveProfile();updateUI();show('💔 KALAH', '<div class="modeCard"><b>Energy habis!</b><small>Kamu bisa mencoba lagi. Pada versi Play Store nanti tombol ini dapat dihubungkan ke Rewarded Ad SDK agar pemain bisa menonton iklan untuk melanjutkan.</small><button onclick="continueWithAd()">📺 LANJUT +50 HP</button><button onclick="restartBattle()" style="margin-top:8px">🔄 ULANGI BATTLE</button></div>')}
window.continueWithAd=()=>{playerHP=50;busy=false;modal.classList.add('hidden');statusEl.textContent='📺 Demo reward aktif: +50 HP. Siap bertarung lagi!';updateUI()};
window.restartBattle=()=>{playerHP=100;enemyHP=(campaign?currentLevel():modes[mode]).hp;round=1;energy=0;combo=1;busy=false;cells=Array.from({length:64},rnd);while(findMatches().size)cells=Array.from({length:64},rnd);modal.classList.add('hidden');document.getElementById('turnText').textContent='GILIRANMU';statusEl.textContent='🎯 Battle baru dimulai!';render();updateUI()};
document.getElementById('shuffle').onclick=()=>{if(busy)return;cells=Array.from({length:64},rnd);while(findMatches().size)cells=Array.from({length:64},rnd);selected=null;combo=1;statusEl.textContent='🔀 Papan diacak!';render();updateUI();sound('shuffle')};
const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');function show(t,h){title.textContent=t;body.innerHTML=h;modal.classList.remove('hidden')}document.getElementById('close').onclick=()=>modal.classList.add('hidden');
function showHeroes(){show('🧙 HERO ARENA','<p>Pilih karakter original Gem Arena. Setiap hero memiliki skill berbeda.</p><div class="heroGrid">'+heroes.map(h=>'<div class="heroCard '+(h.id===heroId?'active':'')+'"><div class="heroIcon">'+h.icon+'</div><b>'+h.name+'</b><div class="rarity">★ '+h.rarity+'</div><small>'+h.skill+' — '+h.desc+'</small><button onclick="chooseHero(\''+h.id+'\')">'+(h.id===heroId?'DIPILIH':'PILIH HERO')+'</button></div>').join('')+'</div>')}window.chooseHero=id=>{heroId=id;localStorage.setItem('gaHero',id);modal.classList.add('hidden');energy=0;statusEl.textContent='🎭 '+hero().name+' dipilih! Isi Energy untuk memakai skill.';updateUI();sound('buy')};document.getElementById('heroBtn').onclick=showHeroes;
const rulesBtn=document.getElementById('rules');if(rulesBtn)rulesBtn.onclick=()=>show('📖 Gem Arena Rules','<p><b>Match 3</b> untuk skor, koin, dan Energy.</p><p>💣 Match 4: Bomb • ⚡ Match 5: Lightning • 🌈 Match 6+: Rainbow.</p><p>⚡ Isi Energy sampai 100 untuk memakai Skill Hero.</p>');
function formatLeft(ms){const h=Math.floor(ms/3600000),m=Math.ceil((ms%3600000)/60000);return h+'j '+m+'m';}
function chestReady(){return Date.now()-lastChest>=CHEST_COOLDOWN;}
function openChestRoom(){
  const ready=chestReady();
  if(ready){
    show('🎁 CHEST SIAP!', '<div class="chestHero"><div class="chestIcon">🎁</div><b>Chest siap dibuka!</b><small>Dapatkan coins dan booster.</small><button onclick="claimChest()">🎁 BUKA CHEST</button></div>');
  }else{
    const left=Math.max(0,CHEST_COOLDOWN-(Date.now()-lastChest));
    show('⏳ CHEST', '<div class="chestHero"><div class="chestIcon">🔒</div><b>Chest belum siap</b><small>Tunggu '+formatLeft(left)+' lagi.</small></div>');
  }
}
window.claimChest=()=>{
  if(!chestReady())return;
  lastChest=Date.now();
  coins+=100;
  boosters.bomb++;
  modal.classList.add('hidden');
  statusEl.textContent='🎁 Chest dibuka! +100 coins dan 💣 Bomb!';
  updateUI();
  sound('buy');
};
document.getElementById('chestBtn').onclick=openChestRoom;
function openProfile(){const h=hero();show('👤 PROFILE GEM PLAYER','<div class="modeCard"><b>'+playerName+'</b><small>'+currentLeague().icon+' '+currentLeague().name+' • '+rankPoints+' RP</small><p>🏆 Menang: '+wins+' • 💔 Kalah: '+losses+'</p><p>⭐ Skor tertinggi: '+highestScore+'</p><p>🧙 Hero: '+h.icon+' '+h.name+'</p><button onclick="showHeroes()">🧙 GANTI HERO</button></div>')}
function openRank(){const l=currentLeague();show('🏆 RANK ARENA','<div class="modeCard"><b>'+l.icon+' '+l.name+'</b><small>'+rankPoints+' Rank Point</small><p>🥇 Crystal Master — 980 RP</p><p>🥈 Neon Hunter — 720 RP</p><p>🥉 Arena Rogue — 510 RP</p><p>👤 '+playerName+' — '+rankPoints+' RP</p><button onclick="enterBattle()">⚔️ MASUK BATTLE</button></div>')}
function enterBattle(){document.getElementById('app').classList.remove('lobby-mode');document.getElementById('lobby').classList.add('hidden');modal.classList.add('hidden');window.scrollTo({top:0,behavior:'instant'});restartBattle()}
function openLobby(){document.getElementById('app').classList.add('lobby-mode');document.getElementById('lobby').classList.remove('hidden');document.getElementById('lobbyPlayerName').textContent=playerName;clearTimeout(enemyTimer)}
window.openLobby=openLobby;const backLobbyBtn=document.getElementById('backLobby');if(backLobbyBtn)backLobbyBtn.onclick=openLobby;
function openBattleModes(){show('⚔️ BATTLE ARENA','<p>Pilih mode pertandingan:</p>'+Object.entries(modes).map(([id,m])=>'<div class="modeCard"><b>⚔️ '+m.name+'</b><small>'+m.desc+' • Reward '+m.reward+' 🪙</small><button onclick="chooseMode(&quot;'+id+'&quot;)">▶ MAIN MODE INI</button></div>').join(''))}
document.getElementById('profileBtn').onclick=openProfile;document.getElementById('profileFooter').onclick=openProfile;
document.getElementById('claimMission').onclick=()=>{if(mission<30||missionClaimed)return;coins+=150;missionClaimed=true;updateUI();statusEl.textContent='🎁 Daily Mission selesai! +150 coins.';sound('buy')};
window.openMap=()=>{const unlocked=Math.min(levelId,levels.length);show('🗺️ GEM ARENA MAP','<div class="worldHeader"><b>🌍 Campaign Dunia Pertama</b><small> Selesaikan level untuk membuka arena berikutnya.</small></div><div class="mapList">'+levels.map(l=>'<div class="levelCard '+(l.id<unlocked?'unlocked':l.id===unlocked?'current unlocked':'locked')+'"><div class="levelIcon">'+(l.id<=unlocked?l.icon:'🔒')+'</div><div><b>LEVEL '+l.id+' • '+l.world+'</b><small>'+l.desc+'<br>👹 '+l.enemy+' • 🪙 '+l.reward+'</small></div><button class="levelAction" '+(l.id<=unlocked?'onclick="chooseLevel('+l.id+')"':'disabled')+'>'+((l.id===levelId)?'▶ MAIN':l.id<=unlocked?'PILIH':'🔒')+'</button></div>').join('')+'</div>')};
window.chooseLevel=id=>{if(id>levelId)return;campaign=true;levelId=id;localStorage.setItem('gaLevel',levelId);modal.classList.add('hidden');enterBattle();statusEl.textContent='🗺️ '+currentLevel().world+' dimulai! Kalahkan '+currentLevel().enemy+'!';};
document.getElementById('mapBtn').onclick=window.openMap;document.getElementById('quickMatchBtn').onclick=()=>{campaign=false;mode='classic';enterBattle()};document.getElementById('leaderboardBtn').onclick=openRank;
document.getElementById('modeBtn').onclick=openBattleModes;window.chooseMode=id=>{campaign=false;mode=id;modal.classList.add('hidden');enterBattle();statusEl.textContent='⚔️ '+modes[id].name+' dipilih! Battle dimulai.'};
document.getElementById('shop').onclick=()=>show('🛒 Gem Shop','<div class="shopItem">💣 Bomb <button onclick="buy(100,\'bomb\')">100 🪙</button></div><div class="shopItem">⚡ Lightning <button onclick="buy(150,\'lightning\')">150 🪙</button></div><div class="shopItem">🌈 Rainbow <button onclick="buy(250,\'rainbow\')">250 🪙</button></div>');
function buy(n,k){if(coins<n){statusEl.textContent='🪙 Koin belum cukup.';modal.classList.add('hidden');return}coins-=n;boosters[k]++;updateUI();statusEl.textContent='🎉 '+k+' berhasil dibeli!';modal.classList.add('hidden');sound('buy')}let audioCtx;
function unlockAudio(){
  if(!soundOn)return;
  try{
    audioCtx??=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
  }catch(e){}
}
function sound(kind){if(!soundOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();const map={match:[520,.09],bomb:[90,.25],lightning:[880,.2],rainbow:[660,.28],shuffle:[330,.12],buy:[740,.15]};const [freq,dur]=map[kind]||[440,.1];o.frequency.value=freq;o.type=kind==='bomb'?'sawtooth':'sine';g.gain.setValueAtTime(.08,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}}
// Hook monetisasi: prototype web tetap tanpa SDK iklan. Untuk Android, sambungkan tombol rewarded ke AdMob/AppLovin dan panggil reward hanya setelah callback sukses.
document.getElementById('sound').onclick=()=>{soundOn=!soundOn;document.getElementById('sound').textContent=soundOn?'🔊':'🔇';statusEl.textContent=soundOn?'🔊 Suara aktif.':'🔇 Suara dimatikan.'};window.addEventListener('beforeunload',()=>{clearTimeout(enemyTimer);clearInterval(matchTimer)});document.getElementById('lobbyBattle').onclick=openBattleModes;document.getElementById('lobbyCampaign').onclick=window.openMap;document.getElementById('lobbyRank').onclick=openRank;document.getElementById('lobbyProfile').onclick=openProfile;document.getElementById('lobbyShop').onclick=()=>document.getElementById('shop').click();document.getElementById('lobbyChest').onclick=openChestRoom;enemyHP=(campaign?currentLevel():modes[mode]).hp;init();openLobby();
