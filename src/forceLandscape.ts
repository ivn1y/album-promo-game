/**
 * Иммерсивный мобильный режим (landscape, PWA, почти fullscreen).
 * Сейчас НЕ подключён — см. комментарии в main.ts, config.ts, index.html.
 *
 * Включить снова:
 * 1. main.ts — раскомментировать блок «immersive mobile»
 * 2. config.ts — mode: Phaser.Scale.ENVELOP
 * 3. index.html — PWA meta, .force-landscape--portrait, position:fixed на body
 * 4. manifest.webmanifest — "orientation": "landscape-primary"
 */

export function initForceLandscape(onLayoutChange?: () => void): void {
  const tryLock = (): void => {
    const o = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
    if (typeof o?.lock === 'function') {
      void o.lock('landscape').catch(() => {});
    }
  };

  const onFirstGesture = (): void => tryLock();
  document.body.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
  document.body.addEventListener('click', onFirstGesture, { once: true });

  const mq = window.matchMedia('(orientation: portrait)');
  const sync = (): void => {
    document.documentElement.classList.toggle('force-landscape--portrait', mq.matches);
    if (!mq.matches) tryLock();
    onLayoutChange?.();
  };

  mq.addEventListener('change', sync);
  sync();
}
