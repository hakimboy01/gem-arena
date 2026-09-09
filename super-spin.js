/* Super Spin: 50,000 in-game coins OR 5 completed demo rewarded ads. */
(function(){
  const COST=50000, ADS_REQUIRED=5, KEY='jcrSuperAds';
  const fmt=n=>new Intl.NumberFormat('id-ID').format(Math.floor(n));
  function modal(t,h){document.getElementById('modalTitle').textContent=t;document.getElementById('modalBody').innerHTML=h;document.getElementById('modal').classList.remove('hidden')}
  function close(){document.getElementById('modal').classList.add('hidden')}
  function getBalance(){try{return Number((JSON.parse(localStorage.getItem('jcr'))||{}).balance)||0}catch(e){return 0}}
  function saveBalance(v){const d=JSON.parse(localStorage.getItem('jcr'))||{};d.balance=v;localStorage.setItem('jcr',JSON.stringify(d))}
  function start(){localStorage.setItem('jcrSuperReady','1');location.reload()}
  function menu(){
    const watched=Math.min(ADS_REQUIRED,Number(localStorage.getItem(KEY)||0));
    modal('🚀 SUPER SPIN',`<div class="jackpot">🚀 SUPER SPIN</div><p>Putaran premium dengan peluang kemenangan lebih besar.</p><button id="superBuy">🪙 BELI — ${fmt(COST)} COIN</button><hr><p><b>ATAU GRATIS</b></p><p>📺 Tonton iklan: <b>${watched}/${ADS_REQUIRED}</b></p><button id="superAd">📺 TONTON IKLAN 5 DETIK</button><p style="font-size:11px;color:#9db0c9">Hadiah hanya dihitung setelah setiap iklan selesai.</p>`);
    setTimeout(()=>{
      const buy=document.getElementById('superBuy'),ad=document.getElementById('superAd');
      if(buy)buy.onclick=()=>{const bal=getBalance();if(bal<COST){modal('🪙 COIN TIDAK CUKUP',`<p>Super Spin membutuhkan <b>${fmt(COST)} COIN</b>.</p><button id="backSuper">⬅️ KEMBALI</button>`);setTimeout(()=>{const x=document.getElementById('backSuper');if(x)x.onclick=menu},0);return}saveBalance(bal-COST);close();start()};
      if(ad)ad.onclick=async()=>{close();try{const ok=await window.showRewardedAd();if(ok===false)throw new Error('not completed');const n=Math.min(ADS_REQUIRED,Number(localStorage.getItem(KEY)||0)+1);localStorage.setItem(KEY,String(n));if(n>=ADS_REQUIRED){localStorage.removeItem(KEY);modal('🎉 SUPER SPIN TERBUKA!',`<p>Kamu sudah menyelesaikan <b>${ADS_REQUIRED} iklan</b>.</p><button id="startSuper">🚀 MULAI SUPER SPIN</button>`);setTimeout(()=>{const s=document.getElementById('startSuper');if(s)s.onclick=()=>{close();start()}},0)}else{modal('📺 IKLAN SELESAI',`<div class="jackpot">${n}/${ADS_REQUIRED}</div><p>Sisa <b>${ADS_REQUIRED-n} iklan</b> lagi untuk Super Spin gratis.</p><button id="nextSuperAd">📺 LANJUTKAN</button>`);setTimeout(()=>{const x=document.getElementById('nextSuperAd');if(x)x.onclick=menu},0)}}catch(e){modal('Iklan Belum Selesai','<p>Iklan harus selesai untuk dihitung.</p><button id="retrySuper">⬅️ KEMBALI</button>');setTimeout(()=>{const x=document.getElementById('retrySuper');if(x)x.onclick=menu},0)}};
    },0);
  }
  function prepare(){
    if(localStorage.getItem('jcrSuperReady')!=='1')return;
    localStorage.removeItem('jcrSuperReady');
    setTimeout(()=>{
      const btn=document.getElementById('spin');
      if(!btn)return;
      /* Premium test: a normal spin starts, while the game keeps its existing jackpot/free-spin rules. */
      btn.click();
    },700);
  }
  document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('buySuper');if(b)b.onclick=menu;prepare()});
})();