/* Demo Rewarded Ads adapter for Jungle Coin Rush.
   Later, replace window.showRewardedAd with the real rewarded-ad SDK bridge.
*/
(function(){
  if(window.showRewardedAd)return;
  const esc=s=>String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  window.showRewardedAd=function(){
    return new Promise(resolve=>{
      const old=document.getElementById('demoAdOverlay');
      if(old)old.remove();
      const overlay=document.createElement('div');
      overlay.id='demoAdOverlay';
      overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,7,16,.96);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif;color:#fff;';
      overlay.innerHTML='<div style="width:min(420px,94vw);border:2px solid #ffd34e;border-radius:22px;background:#0c1b38;box-shadow:0 20px 70px rgba(0,0,0,.6);overflow:hidden;text-align:center"><div style="padding:10px 14px;background:#07101f;font-size:12px;letter-spacing:1px;color:#b9ff54">DEMO REWARDED AD</div><div style="padding:26px 20px"><div style="font-size:62px;margin-bottom:12px">📺</div><h2 style="margin:0 0 8px;color:#ffd34e">Iklan Demo</h2><p style="margin:0 0 18px;color:#dbe7ff">Ini simulasi iklan berhadiah untuk pengujian game.</p><div id="demoAdCount" style="font-size:46px;font-weight:800;margin:16px 0;color:#b9ff54">5</div><p id="demoAdText" style="margin:0;color:#aab7ce">Tunggu sampai iklan selesai...</p></div></div>';
      document.body.appendChild(overlay);
      let n=5;
      const timer=setInterval(()=>{
        n--;
        const c=document.getElementById('demoAdCount');
        const t=document.getElementById('demoAdText');
        if(c)c.textContent=n>0?n:'✓';
        if(t)t.textContent=n>0?'Tunggu sampai iklan selesai...':'Iklan selesai — hadiah diberikan!';
        if(n<=0){
          clearInterval(timer);
          setTimeout(()=>{overlay.remove();resolve(true)},450);
        }
      },1000);
    });
  };
})();
