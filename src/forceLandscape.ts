/** Мобильный просмотр: landscape, подсказка в портрете, PWA/полный экран где возможно. */

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function tryFullscreen(): void {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  const req =
    el.requestFullscreen?.bind(el) ??
    (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(el);
  if (req) void Promise.resolve(req()).catch(() => {});
}

export function initForceLandscape(): void {
  const tryLock = (): void => {
    const o = screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
    if (typeof o?.lock === 'function') {
      void o.lock('landscape').catch(() => {});
    }
  };

  const onFirstGesture = (): void => {
    tryLock();
    tryFullscreen();
  };

  document.body.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });
  document.body.addEventListener('click', onFirstGesture, { once: true });

  const mq = window.matchMedia('(orientation: portrait)');
  const sync = (): void => {
    document.documentElement.classList.toggle('force-landscape--portrait', mq.matches);
    if (!mq.matches) tryLock();
  };

  mq.addEventListener('change', sync);
  sync();

  if (isIos() && !isStandalone()) {
    window.setTimeout(() => {
      const hint = document.createElement('div');
      hint.className = 'safari-fullscreen-hint';
      hint.textContent =
        'Во вкладке Safari сверху занято место. Чтобы почти во весь экран: «Поделиться» → «На экран «Домой»» и запуск с иконки.';
      hint.addEventListener('click', () => hint.remove(), { once: true });
      document.body.appendChild(hint);
      window.setTimeout(() => hint.remove(), 12000);
    }, 1800);
  }
}
