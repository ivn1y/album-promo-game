import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { CornerNarrationBox } from '../ui/CornerNarrationBox';
import { enableDebugPositionPicker } from '../devDebugPos';
import { enableDebugHintPicker } from '../devDebugHints';

const FONT = '"VT323", "Courier New", monospace';

/** Дверь по центру кадра scene1lvl01 (2752×1536) — стрелка чуть выше середины двери (▼ указывает вниз на проём). */
const DOOR_ARROW_U = 0.5;
const DOOR_ARROW_V = 0.46;
const DOOR_HIT_W = 130;
const DOOR_HIT_H = 200;

const SHOP_SCENE1_LINES = [
  {
    speaker: 'Помощник',
    text: 'Вот она — лавка, о которой говорили. Дверь цела, но замок взломали: следы крепкий рывок, не дилетант.',
  },
  {
    speaker: 'Помощник',
    text: 'Хозяин уже убрал товар с витрины и злится на каждого прохожего. Осмотритесь спокойно: детали любят прятаться там, куда не смотрят с паникой.',
  },
  {
    speaker: null,
    text: 'Внутри пахнет хлебом и воском. Где-то здесь должна начинаться цепочка улик.',
  },
];

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

/** Лавка снаружи / первый кадр локации (scene1lvl01). */
export class ShopScene1 extends Phaser.Scene {
  private cornerBox?: CornerNarrationBox;

  constructor() {
    super({ key: 'ShopScene1' });
  }

  preload(): void {
    if (!this.textures.exists('shop_scene1_bg')) {
      this.load.image('shop_scene1_bg', '/assets/scenes/level01/scene1lvl01.jpg');
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('shop_scene1_bg')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузилась сцена лавки', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'shop_scene1_bg');
    const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(sc).setDepth(0);
    enableDebugPositionPicker(this, bg);
    enableDebugHintPicker(this, bg);

    this.cornerBox = new CornerNarrationBox(this);
    this.events.once('shutdown', () => {
      this.cornerBox?.destroy();
      this.cornerBox = undefined;
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.cameras.main.once('camerafadeincomplete', () => {
      this.cornerBox?.show(SHOP_SCENE1_LINES, () => {
        this.showDoorArrowCue(bg);
      });
    });
  }

  /** После диалога — стрелка на дверь; клик → внутрь (сцена 2). */
  private showDoorArrowCue(bg: Phaser.GameObjects.Image): void {
    const { x: ax, y: ay } = texFracToScreen(bg, DOOR_ARROW_U, DOOR_ARROW_V);

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
      .rectangle(ax, ay, DOOR_HIT_W, DOOR_HIT_H, 0xffffff, 0)
      .setDepth(52)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(900, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ShopScene2');
        });
      });
  }
}
