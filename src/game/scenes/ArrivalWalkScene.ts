import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const THOUGHTS = [
  'Значит, это и есть тот самый город.',
  'Мрачнее, чем я представлял.',
  'Камень, сырость, узкие улицы...',
  'Говорят, здесь годами никто не расследовал даже краж.',
  'Люди привыкли жить так, будто закона не существует.',
  'Что ж... посмотрим, что тут можно сделать.',
  'Кажется, меня кто-то ждёт впереди.',
];

export class ArrivalWalkScene extends Phaser.Scene {
  private thoughtText!: Phaser.GameObjects.Text;
  private thoughtIndex = 0;
  private canAdvance = false;
  private bg!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Graphics;
  private finished = false;

  constructor() {
    super({ key: 'ArrivalWalkScene' });
  }

  create(): void {
    this.thoughtIndex = 0;
    this.canAdvance = false;
    this.finished = false;

    this.cameras.main.setBackgroundColor(0x0a0a0a);

    this.bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'arrival_walk_bg');
    this.fitBackground();
    this.bg.setAlpha(0);

    this.vignette = this.add.graphics().setDepth(5);
    this.drawVignette();

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a12, 0.35)
      .setDepth(6);

    this.thoughtText = this.add
      .text(GAME_WIDTH / 2, 64, '', {
        fontFamily: 'serif',
        fontSize: '20px',
        fontStyle: 'italic',
        color: '#9a9aaa',
        align: 'center',
        lineSpacing: 8,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setAlpha(0);

    const advanceHint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 32, '...', {
        fontFamily: 'serif',
        fontSize: '14px',
        color: '#444455',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    this.tweens.add({
      targets: this.bg,
      alpha: 1,
      duration: 2000,
      ease: 'Sine.easeIn',
    });

    this.startSlowZoom();

    this.time.delayedCall(1800, () => {
      this.showThought();
      this.tweens.add({ targets: advanceHint, alpha: 0.6, duration: 1000 });
      this.tweens.add({
        targets: advanceHint,
        alpha: 0.2,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        delay: 1000,
      });
    });

    this.input.on('pointerdown', () => this.handleAdvance());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleAdvance());
  }

  private fitBackground(): void {
    const scaleX = GAME_WIDTH / this.bg.width;
    const scaleY = GAME_HEIGHT / this.bg.height;
    const scale = Math.max(scaleX, scaleY);
    this.bg.setScale(scale);
  }

  private startSlowZoom(): void {
    const startScale = this.bg.scaleX;
    this.tweens.add({
      targets: this.bg,
      scaleX: startScale * 1.06,
      scaleY: startScale * 1.06,
      duration: THOUGHTS.length * 5000 + 8000,
      ease: 'Sine.easeInOut',
    });
  }

  private drawVignette(): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const g = this.vignette;

    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    g.fillRect(0, 0, w, h * 0.18);

    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
    g.fillRect(0, h * 0.82, w, h * 0.18);

    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0, 0, 0.5);
    g.fillRect(0, 0, w * 0.08, h);

    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.5, 0.5, 0);
    g.fillRect(w * 0.92, 0, w * 0.08, h);
  }

  private handleAdvance(): void {
    if (this.finished) return;
    if (!this.canAdvance) return;
    this.canAdvance = false;

    this.tweens.add({
      targets: this.thoughtText,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.thoughtIndex++;
        if (this.thoughtIndex >= THOUGHTS.length) {
          this.transitionOut();
        } else {
          this.showThought();
        }
      },
    });
  }

  private showThought(): void {
    this.thoughtText.setText(THOUGHTS[this.thoughtIndex]);
    this.thoughtText.setAlpha(0);

    this.tweens.add({
      targets: this.thoughtText,
      alpha: 1,
      duration: 800,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.canAdvance = true;
      },
    });
  }

  private transitionOut(): void {
    this.finished = true;

    const black = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setDepth(50)
      .setAlpha(0);

    this.tweens.add({
      targets: black,
      alpha: 1,
      duration: 1200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.scene.start('MeetAssistantScene');
      },
    });
  }
}
