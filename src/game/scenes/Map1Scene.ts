import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { CornerNarrationBox } from '../ui/CornerNarrationBox';
const FONT = '"VT323", "Courier New", monospace';

const MAP1_INTRO_LINES = [
  {
    speaker: 'Помощник',
    text: 'Это набросок главной площади — то самое сердце нижнего квартала, о котором я говорил. Здесь сходятся дороги, лавки и шум будней.',
  },
  {
    speaker: 'Помощник',
    text: 'Сегодня утром ограбили торговую лавку у края площади: взломали замок, сняли товар с полок. Хозяин в ярости, но свидетелей как не бывало.',
  },
  {
    speaker: null,
    text: 'Карта грубая, зато правдивая: по ней хотя бы не заблудишься, пока город не начнёт вам доверять.',
  },
];

/** Карта 1 (1536×1024) — доли от левого верхнего угла текстуры: лавка внизу справа, стрелка над витриной/дверью. */
const SHOP_ARROW_U = 0.86;
const SHOP_ARROW_V = 0.58;
const SHOP_HIT_W = 120;
const SHOP_HIT_H = 150;

function texFracToScreen(
  bg: Phaser.GameObjects.Image,
  u: number,
  v: number,
): { x: number; y: number } {
  const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
  const dx = (u - 0.5) * bg.width * sc;
  const dy = (v - 0.5) * bg.height * sc;
  return { x: GAME_WIDTH / 2 + dx, y: GAME_HEIGHT / 2 + dy };
}

/** Первая игровая карта: площадь, подсветка лавки стрелкой в стиле ворот. */
export class Map1Scene extends Phaser.Scene {
  private cornerBox?: CornerNarrationBox;

  constructor() {
    super({ key: 'Map1Scene' });
  }

  preload(): void {
    if (!this.textures.exists('map1game')) {
      this.load.image('map1game', '/assets/scenes/level01/map1game.png');
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('map1game')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузилась карта 1', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'map1game');
    const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(sc).setDepth(0);

    this.cornerBox = new CornerNarrationBox(this);
    this.events.once('shutdown', () => {
      this.cornerBox?.destroy();
      this.cornerBox = undefined;
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.cameras.main.once('camerafadeincomplete', () => {
      this.cornerBox?.show(MAP1_INTRO_LINES, () => {
        this.showShopArrowCue(bg);
      });
    });
  }

  private showShopArrowCue(bg: Phaser.GameObjects.Image): void {
    const { x: ax, y: ay } = texFracToScreen(bg, SHOP_ARROW_U, SHOP_ARROW_V);

    const arrow = this.add
      .text(ax, ay, '▼', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);

    const glow = this.add.graphics().setDepth(48).setAlpha(0.25);
    glow.fillStyle(0xc4a35a, 0.12);
    glow.fillCircle(ax, ay, 28);

    this.tweens.add({
      targets: arrow,
      alpha: 1,
      duration: 400,
    });

    this.tweens.add({
      targets: arrow,
      y: ay + 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });

    this.tweens.add({
      targets: glow,
      alpha: 0.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });

    this.add
      .rectangle(ax, ay, SHOP_HIT_W, SHOP_HIT_H, 0xffffff, 0)
      .setDepth(52)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(1200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ShopScene1');
        });
      });
  }
}
