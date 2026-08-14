/**
 * Registra o Service Worker para cache inteligente de imagens e fontes
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registrado com sucesso:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] Falha ao registrar Service Worker:', err);
        });
    });
  }
}

/**
 * Pré-carrega imagens de capas em segundo plano usando Image() e Cache API
 */
export function preloadModuleImages(imageUrls: string[]): void {
  if (typeof window === 'undefined') return;

  const validUrls = imageUrls.filter((url) => url && url.startsWith('http'));
  if (validUrls.length === 0) return;

  // Usa requestIdleCallback se disponível para não disputar CPU no carregamento inicial
  const schedulePreload = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200));

  schedulePreload(() => {
    validUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  });
}
