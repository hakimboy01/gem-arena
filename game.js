const symbols=['🪙','💎','🧧','🪭','🍀','🐾','🌕','🧨'];
const reels=document.getElementById('reels'),spinBtn=document.getElementById('spin');
let balance=250000,bet=10000,sound=true,spinning=false,lastWin=0;
const fmt=n=>new Intl.NumberFormat('id-ID').format(Math.floor(n));
function save(){localStorage.setItem('jcr',JSON.stringify({balance,bet}))}
function load(){try{const d=JSON.parse(localStorage.getItem('jcr'));if(d){balance=d.balance??balance;bet=d.bet??bet}}catch(e){}}
function render(){document.getElementById('coins').textContent=fmt(balance);document.getElementById('bet').textContent=fmt(bet);document.getElementById('win').textContent=fmt(lastWin)}
function makeGrid(){reels.innerHTML='';for(let c=0;c<5;c++){const r=document.createElement('div');r.className='reel';for(let row=0;row<3;row++){const s=document.createElement('div');s.className='symbol';s.dataset.c=c;s.dataset.r=row;s.textContent=symbols[Math.floor(Math.random()*symbols.length)];r.appendChild(s)}reels.appendChild(r)}}
function beep(f=440,d=.08){if(!sound)return;try{const C=AudioContext||webkitAudioContext,ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.value=.04;o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d);o.stop(ctx.currentTime+d)}catch(e){}}
function modal(title,html){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=html;document.getElementById('modal').classList.remove('hidden')}
function close(){document.getElementById('modal').classList.add('hidden')}
document.getElementById('close').onclick=close;
function spin(){
 if(spinning||balance<bet){modal('COIN TIDAK CUKUP','<p>Kumpulkan bonus harian lalu coba lagi.</p>');return}
 spinning=true;spinBtn.disabled=true;balance-=bet;lastWin=0;render();
 const cells=[...document.querySelectorAll('.symbol')];let ticks=0;
 const timer=setInterval(()=>{cells.forEach(x=>x.textContent=symbols[Math.floor(Math.random()*symbols.length)]);beep(180+ticks*8,.03);ticks++;if(ticks>=16){clearInterval(timer);finish(cells)}},75);
}
function finish(cells){
 const rows=[0,1,2].map(r=>cells.filter(x=>+x.dataset.r===r).map(x=>x.textContent));
 let best=0,winning=[];
 rows.forEach((row,ri)=>{const counts={};row.forEach(s=>counts[s]=(counts[s]||0)+1);const max=Math.max(...Object.values(counts));if(max>=3){const sym=Object.keys(counts).find(k=>counts[k]===max);const mult=max===5?12:max===4?5:2;const w=bet*mult;if(w>best){best=w;winning=cells.filter(x=>+x.dataset.r===ri&&x.textContent===sym)}}});
 const jackpot=Math.random()<0.018;
 if(jackpot){best=bet*30;winning=cells.filter((_,i)=>i%4===0).slice(0,5);modal('🐯 JACKPOT!', '<div class="jackpot">JUNGLE JACKPOT!</div><p>Kamu memenangkan <b>'+fmt(best)+' COIN</b></p><button id="claim">📺 TONTON IKLAN & CLAIM</button><p><small>Hadiah adalah coin virtual dalam game.</small></p>');setTimeout(()=>{document.getElementById('claim').onclick=()=>claimJackpot(best)},0)}
 else if(best){lastWin=best;balance+=best;winning.forEach(x=>x.classList.add('win'));setTimeout(()=>winning.forEach(x=>x.classList.remove('win')),900);beep(880,.2)}
 else modal('Belum Beruntung','<p>Coba putaran berikutnya untuk mencari kombinasi baru. 🍀</p>');
 save();render();spinning=false;spinBtn.disabled=false;
}
async function claimJackpot(amount){
 close();
 // Integrasi Android dapat mengganti fungsi ini dengan Rewarded Ad SDK asli.
 if(typeof window.showRewardedAd==='function'){
   try{await window.showRewardedAd()}catch(e){modal('Iklan Belum Selesai','<p>Hadiah belum bisa diberikan karena iklan tidak selesai.</p>');return}
 }else{
   modal('📺 IKLAN HADIAH','<p>Simulasi iklan untuk versi web.</p><div class="count" id="count">8</div><p>Menunggu sampai iklan selesai...</p>');
   let n=8;const t=setInterval(()=>{n--;const el=document.getElementById('count');if(el)el.textContent=n;if(n<=0){clearInterval(t);close();giveReward(amount)}},1000);return;
 }
 giveReward(amount);
}
function giveReward(amount){balance+=amount;lastWin=amount;save();render();modal('🎉 HADIAH DIKLAIM','<div class="jackpot">+'+fmt(amount)+' COIN</div><p>Hadiah virtual sudah masuk ke saldo game.</p>');beep(990,.25)}
document.getElementById('spin').onclick=spin;
document.getElementById('minus').onclick=()=>{bet=Math.max(1000,bet-5000);render();save()};
document.getElementById('plus').onclick=()=>{bet=Math.min(50000,bet+5000);render();save()};
document.getElementById('max').onclick=()=>{bet=Math.min(50000,balance);render();save()};
document.getElementById('how').onclick=()=>modal('Cara Main','<p>Tekan SPIN untuk memutar 5 reel. Dapatkan 3, 4, atau 5 simbol yang sama dalam satu baris untuk memperoleh coin virtual.</p><p>JACKPOT membuka tombol Claim dengan Rewarded Ad.</p>');
document.getElementById('bonus').onclick=()=>{const key='jcrBonusDay',today=new Date().toDateString();if(localStorage.getItem(key)===today){modal('Bonus Harian','<p>Bonus hari ini sudah diambil. Kembali lagi besok! 🎁</p>');return}balance+=25000;localStorage.setItem(key,today);save();render();modal('🎁 BONUS HARIAN','<div class="jackpot">+25.000 COIN</div><p>Bonus virtual sudah ditambahkan.</p>')};
document.getElementById('sound').onclick=()=>{sound=!sound;document.getElementById('sound').textContent=sound?'🔊 Suara':'🔇 Senyap'};
document.getElementById('settings').onclick=()=>modal('Pengaturan','<p>Versi awal Jungle Coin Rush.</p><p>Monetisasi produksi memerlukan aplikasi Android, akun AdMob, dan Rewarded Ad SDK asli.</p>');
load();makeGrid();render();