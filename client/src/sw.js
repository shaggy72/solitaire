// Service worker (vite-plugin-pwa, strategie injectManifest). Elke build krijgt een vers precache-manifest;
// cleanupOutdatedCaches ruimt oude versies op. skipWaiting + clientsClaim: een nieuwe versie neemt meteen over
// (register-sw.js herlaadt dan de pagina). Heeft de app push-meldingen of "delen met"? Voeg die hier toe, onder de routes.
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Offline fallback voor navigaties. /api/* en /downloads/* uitgesloten, anders krijgt een mislukte API-vraag
// of een downloadlink ten onrechte de app (index.html) terug.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), {
  denylist: [/^\/api\//, /^\/downloads\//],
}));
