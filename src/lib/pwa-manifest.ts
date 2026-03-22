/**
 * Switches the PWA manifest link based on the current route.
 * Admin routes use admin.webmanifest; everything else uses manifest.webmanifest.
 */
export function updateManifestLink() {
  const link = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
  if (!link) return;
  const isAdmin = window.location.pathname.startsWith('/admin');
  const target = isAdmin ? '/admin.webmanifest' : '/manifest.webmanifest';
  if (link.href !== new URL(target, window.location.origin).href) {
    link.href = target;
  }
}
