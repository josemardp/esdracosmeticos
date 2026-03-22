import { registerSW } from 'virtual:pwa-register';

// Auto-update SW when new version is available
registerSW({
  onNeedRefresh() {
    // Silently update — no intrusive prompt
    console.log('[PWA] New version available, updating...');
  },
  onOfflineReady() {
    console.log('[PWA] App ready for offline use (static assets only).');
  },
  onRegisteredSW(swUrl) {
    console.log('[PWA] Service worker registered:', swUrl);
  },
});
