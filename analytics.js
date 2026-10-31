/* Basic opt-in analytics. No Google connection until consent. */
(() => {
  'use strict';
  const id = 'G-CCKMTK65CN', key = 'afsanora_analytics';
  const live = /^(afsanora\.com|www\.afsanora\.com|pathora\.afsanora\.com|play\.pathora\.afsanora\.com)$/.test(location.hostname);
  let enabled = false, loaded = false;
  const clean = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return ''; } };
  const choice = () => document.cookie.split('; ').find(v => v.startsWith(key + '='))?.split('=')[1];
  function tag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  function start() {
    if (!live || enabled) return;
    enabled = true; window['ga-disable-' + id] = false;
    tag('consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    tag('consent', 'update', {analytics_storage:'granted'});
    if (!loaded) {
      loaded = true; tag('js', new Date());
      tag('config', id, {send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:clean(location.href),page_referrer:clean(document.referrer),cookie_expires:15552000});
      const script = document.createElement('script'); script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.append(script);
    }
    tag('event','page_view',{page_location:clean(location.href),page_referrer:clean(document.referrer)});
    if(location.hostname==='play.pathora.afsanora.com') tag('event','game_open');
  }
  function save(allow) {
    document.cookie = key + '=' + (allow?'yes':'no') + '; Max-Age=15552000; Path=/; SameSite=Lax' + (live?'; Domain=afsanora.com; Secure':'');
    if(allow) start();
    else {
      enabled=false; window['ga-disable-' + id]=true;
      if(loaded) tag('consent','update',{analytics_storage:'denied'});
      for(const item of document.cookie.split('; ')) {
        const name=item.split('=')[0]; if(!/^_ga($|_)/.test(name)) continue;
        for(const domain of ['', '; Domain=afsanora.com', '; Domain='+location.hostname]) document.cookie=name+'=; Max-Age=0; Path=/'+domain;
      }
    }
    panel.hidden=true;
  }
  const style=document.createElement('style');
  style.textContent='#af-privacy{position:fixed;z-index:2147483647;bottom:48px;left:16px;max-width:410px;width:calc(100% - 32px);box-sizing:border-box;padding:20px;background:#fff;color:#243e36;border:1px solid #a7b8ae;border-radius:12px;box-shadow:0 4px 25px #0003;font:14px/1.5 Arial,sans-serif}#af-privacy[hidden]{display:none}#af-privacy p{margin:8px 0 16px}#af-privacy a{text-decoration:underline}#af-privacy button{padding:10px 16px;margin-right:10px;border:1px solid #294b42;border-radius:5px;background:#fff;color:#294b42;font:600 14px Arial;cursor:pointer}#af-privacy-choice{position:fixed;bottom:8px;left:8px;z-index:2147483646;padding:5px 9px;background:#fff;color:#294b42;border:1px solid #a7b8ae;border-radius:5px;font:12px Arial;cursor:pointer}';
  document.head.append(style);
  const panel=document.createElement('section');panel.id='af-privacy';panel.setAttribute('aria-label','Analytics privacy choices');
  panel.innerHTML='<strong>Help us improve Pathora</strong><p>Allow Google Analytics to measure visits, play time and puzzle results? Optional analytics stays off unless you accept. Your choice applies across our Afsanora and Pathora websites. <a href="https://pathora.afsanora.com/privacy/">Privacy details</a></p><button type="button">Accept analytics</button><button type="button">Reject analytics</button>';
  const buttons=panel.querySelectorAll('button');buttons[0].onclick=()=>save(true);buttons[1].onclick=()=>save(false);
  const reopen=document.createElement('button');reopen.id='af-privacy-choice';reopen.type='button';reopen.textContent='Privacy choices';reopen.onclick=()=>{panel.hidden=false;buttons[0].focus();};
  document.body.append(panel,reopen);panel.hidden=!!choice();if(choice()==='yes')start();
  const allowed=new Set(['game_open','level_start','level_end','active_play','play_web','store_click']);
  window.PathoraAnalytics={event(name,data={}) {
    if(!enabled||!live||!allowed.has(name)||document.hidden)return;
    const out={};
    if(['campaign','daily','free_play','zen','shared'].includes(data.mode))out.game_mode=data.mode;
    for(const field of ['level','width','height','seconds'])if(Number.isFinite(data[field]))out[field]=Math.max(0,Math.min(100000,Math.round(data[field])));
    if(['win','loss'].includes(data.result))out.result=data.result;
    if(['android','ios'].includes(data.platform))out.platform=data.platform;
    tag('event',name,out);
  }};
  document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;
    if(a.href.startsWith('https://play.pathora.afsanora.com/'))window.PathoraAnalytics.event('play_web');
    if(a.href.startsWith('https://play.google.com/store/apps/'))window.PathoraAnalytics.event('store_click',{platform:'android'});
    if(a.href.startsWith('https://apps.apple.com/'))window.PathoraAnalytics.event('store_click',{platform:'ios'});
  });
})();
