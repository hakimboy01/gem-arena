/* Buy Free Spin with in-game coins. Test-friendly: after purchase, 3 Tiger scatters are guaranteed once. */
(function(){
  const COST=50000, FLAG='jcrBuyFree';
  const fmt=n=>new Intl.NumberFormat('id-ID').format(Math.floor(n));
  function modal(title,html){const m=document.getElementById('modal'),t=document.getElementById('modalTitle'),b=document.getElementById('modalBody');if(!m||!t||!b)return;t.textContent=title;b.innerHTML=html;m.classList.remove('hidden')}
  function close(){const b=document.getElementById('close');if(b)b.click()}
  function readBalance(){try{const d=JSON.parse(localStorage.getItem('jcr'));return Number(d&&d.balance)||250000}catch(e){return 250000}}
  function buy(){
    if(localStorage.getItem(FLAG)==='1')return;
    const balance=readBalance();
    if(balance<COST){modal('🪙 COIN TIDAK CUKUP',`<p>Free Spin membutuhkan <b>${fmt(COST)} COIN</b>.</p><p>Saldo kamu: <b>${fmt(balance)} COIN</b>.</p>`);return}
    modal('🐯 BELI FREE SPIN',`<div class="jackpot">${fmt(COST)} COIN</div><p>Dapatkan <b>5 FREE SPIN</b> langsung.</p><p>Biaya akan dipotong dari saldo pemain.</p><button id="buyFreeConfirm">🐯 BELI & MULAI</button><button id="buyFreeCancel">⬅️ BATAL</button>`);
    setTimeout(()=>{
      const ok=document.getElementById('buyFreeConfirm'),no=document.getElementById('buyFreeCancel');
      if(no)no.onclick=close;
      if(ok)ok.onclick=()=>{
        try{
          const d=JSON.parse(localStorage.getItem('jcr'))||{};
          const current=Number(d.balance)||0;
          if(current<COST){close();modal('🪙 COIN TIDAK CUKUP','<p>Saldo berubah. Coba lagi.</p>');return}
          d.balance=current-COST;
          localStorage.setItem('jcr',JSON.stringify(d));
          localStorage.setItem(FLAG,'1');
          location.reload();
        }catch(e){modal('ERROR','<p>Gagal membeli Free Spin. Coba lagi.</p>')}
      };
    },0);
  }
  function preparePurchasedSpin(){
    if(localStorage.getItem(FLAG)!=='1')return;
    localStorage.removeItem(FLAG);
    let calls=0;
    const original=Math.random;
    Math.random=function(){calls++;return calls<=3?.01:.5};
    setTimeout(()=>{const btn=document.getElementById('spin');if(btn)btn.click();},900);
    setTimeout(()=>{Math.random=original},4500);
  }
  function init(){
    const b=document.getElementById('buyFree');
    if(b)b.onclick=()=>{try{const f=typeof window.unlockSound==='function'?window.unlockSound:null;if(f)f()}catch(e){}buy()};
    preparePurchasedSpin();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
