import Phaser from 'phaser';
import { gameConfig } from './game/config';

new Phaser.Game(gameConfig);

/* --- Иммерсивный мобильный режим (landscape / PWA / ENVELOP) — раскомментировать:
import { initForceLandscape } from './forceLandscape';

const game = new Phaser.Game(gameConfig);
const refreshScale = (): void => { game.scale.refresh(); };
initForceLandscape(refreshScale);
window.addEventListener('resize', refreshScale);
window.visualViewport?.addEventListener('resize', refreshScale);
window.visualViewport?.addEventListener('scroll', refreshScale);
--- */
