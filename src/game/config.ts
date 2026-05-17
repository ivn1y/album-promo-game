import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './dimensions';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { CityDistantScene } from './scenes/CityDistantScene';
import { BridgeMeetScene } from './scenes/BridgeMeetScene';
import { Map1Scene } from './scenes/Map1Scene';
import { ShopScene1 } from './scenes/ShopScene1';
import { ShopScene2 } from './scenes/ShopScene2';
import { ShopScene3 } from './scenes/ShopScene3';

export { GAME_HEIGHT, GAME_WIDTH } from './dimensions';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a0a',
  // Обычный мобильный просмотр: вписать кадр, без обрезки (могут быть поля).
  // Иммерсивный fullscreen/landscape: mode: Phaser.Scale.ENVELOP + initForceLandscape в main.ts
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    IntroScene,
    CityDistantScene,
    BridgeMeetScene,
    Map1Scene,
    ShopScene1,
    ShopScene2,
    ShopScene3,
  ],
};
