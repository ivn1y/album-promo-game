import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { showVerticalSliceEndCard } from '../showVerticalSliceEndCard';

const FONT = '"VT323", "Courier New", monospace';

/** Третий кадр лавки / за дверью (scene3lvl01). */
export class ShopScene3 extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene3' });
  }

  preload(): void {
    if (!this.textures.exists('shop_scene3_bg')) {
      this.load.image('shop_scene3_bg', '/assets/scenes/level01/scene3lvl01.jpg');
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('shop_scene3_bg')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузилась сцена 3', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'shop_scene3_bg');
    const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(sc).setDepth(0);

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.cameras.main.once('camerafadeincomplete', () => {
      this.input.once('pointerdown', () => {
        this.cameras.main.fadeOut(900, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          showVerticalSliceEndCard(this);
        });
      });
    });
  }
}
