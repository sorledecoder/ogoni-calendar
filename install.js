// install.js — Install button (Android/Chrome/Edge), iOS hint, service worker + update prompt.
let deferredPrompt = null;
const $ = (id) => document.getElementById(id);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const showInstall = (on) => { const b = $('install-btn'); if (b) b.hidden = !on; };
const say = (m, ms) => (window.toast ? window.toast(m, ms) : alert(m));

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  if (!isStandalone()) showInstall(true);
});
addEventListener('appinstalled', () => { deferredPrompt = null; showInstall(false); say('Calendar installed'); });

addEventListener('DOMContentLoaded', () => {
  const btn = $('install-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null; showInstall(false);
    } else if (isIOS()) {
      say('Tap Share, then "Add to Home Screen"', 7000);
    } else {
      say('Open the browser menu (⋮) and tap "Install app". The page must be on https.', 8000);
    }
  });
  showInstall(!isStandalone());
});

if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) {
            say('Update ready. Reopen the app to apply it.', 6000);
            w.postMessage('SKIP_WAITING');
          }
        });
      });
    }).catch((err) => console.error('Service worker failed:', err));
  });
}
