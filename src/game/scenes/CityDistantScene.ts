import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { bigcityViewUrl } from '../level01Assets';

const FONT = '"VT323", "Courier New", monospace';

const CITY_DESCRIPTION_1 =
  'С дороги город читается как спящий зверь: каменные стены, редкие окна с тёплым светом, дымка над рекой.';

const CITY_DESCRIPTION_2 =
  'Говорят, здесь давно никто не доводит дела до конца — словно сам город прячет следы и молчит о них.';

/** Вид на город издали + две подписи в рамке. */
export class CityDistantScene extends Phaser.Scene {
  private finished = false;

  constructor() {
    super({ key: 'CityDistantScene' });
  }

  preload(): void {
    if (!this.textures.exists('city_distant_bg')) {
      this.load.image('city_distant_bg', bigcityViewUrl);
    }
  }

  create(): void {
    this.finished = false;
    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('city_distant_bg')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузился bigcityview.jpg', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'city_distant_bg');
    const s = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(s).setDepth(0).setAlpha(0);

    const panel = this.createCaptionPanel();
    panel.setDepth(4).setAlpha(0);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'клик, пробел или Esc — дальше', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#c4b8a8',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);

    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 1200,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 700,
      delay: 500,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: hint,
      alpha: 0.9,
      duration: 500,
      delay: 1100,
    });

    this.time.delayedCall(400, () => {
      this.input.on('pointerdown', () => this.goNext());
      this.input.keyboard?.on('keydown-SPACE', () => this.goNext());
    });
    this.input.keyboard?.on('keydown-ESC', () => this.goNext());
  }

  /** Рамка снизу: фон, обводка, два абзаца. */
  private createCaptionPanel(): Phaser.GameObjects.Container {
    const marginX = 48;
    const padX = 22;
    const padY = 18;
    const boxW = GAME_WIDTH - marginX * 2;
    const innerW = boxW - padX * 2;

    const line1 = this.add.text(0, 0, CITY_DESCRIPTION_1, {
      fontFamily: FONT,
      fontSize: '26px',
      color: '#d8d0c8',
      align: 'left',
      wordWrap: { width: innerW },
      lineSpacing: 6,
    });

    const line2 = this.add.text(0, 0, CITY_DESCRIPTION_2, {
      fontFamily: FONT,
      fontSize: '26px',
      color: '#d8d0c8',
      align: 'left',
      wordWrap: { width: innerW },
      lineSpacing: 6,
    });

    const gap = 14;
    const contentH = line1.height + gap + line2.height;
    const boxH = contentH + padY * 2;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT - 28 - boxH / 2;

    const backdrop = this.add
      .rectangle(0, 0, boxW, boxH, 0x0a0a10, 0.88)
      .setStrokeStyle(2, 0xc4a35a, 0.85);

    const innerStroke = this.add
      .rectangle(0, 0, boxW - 8, boxH - 8, 0x000000, 0)
      .setStrokeStyle(1, 0x5a4a38, 0.6);

    const tx = -boxW / 2 + padX;
    const ty = -boxH / 2 + padY;
    line1.setPosition(tx, ty);
    line2.setPosition(tx, ty + line1.height + gap);

    return this.add.container(cx, cy, [backdrop, innerStroke, line1, line2]);
  }

  private goNext(): void {
    if (this.finished) return;
    this.finished = true;

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 4, GAME_HEIGHT + 4, 0x000000)
      .setDepth(20)
      .setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 700,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.scene.start('BridgeMeetScene');
      },
    });
  }
}
