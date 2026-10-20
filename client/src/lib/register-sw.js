// Registreert de service worker en zorgt dat een geïnstalleerde app (beginscherm-icoon) vanzelf naar een nieuwe versie gaat.
// Gebruik in main.jsx:  import { registerServiceWorker } from './lib/register-sw.js';  registerServiceWorker();
//
// Zonder dit blijft een app die dagenlang op de achtergrond openstaat op een oude versie hangen, want de browser
// controleert zelden of de service worker veranderd is. Daarom: bij elke terugkeer naar de app actief controleren,
// en zodra een nieuwe versie het overneemt de pagina herladen. Niet bij de allereerste installatie (dan is er niets verouderd).
export function registerServiceWorker({ swUrl = '/sw.js', reload = () => window.location.reload() } = {}) {
  if (!('serviceWorker' in navigator)) return;
  const start = () => {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register(swUrl).then((reg) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });
    }).catch((err) => console.error('SW-registratie mislukt', err));

    if (hadController) {
      let reloading = false; // nooit twee keer herladen
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return;
        reloading = true;
        reload();
      });
    }
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
}
