import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const INTRO_LINES = [
  'Город стоял в тишине уже много лет.',
  'Преступления оставались нераскрытыми.\nВиновные — ненаказанными.',
  'Однажды туда приехал человек,\nкоторый должен был навести порядок.',
  'Он был детективом.',
  'Или, по крайней мере, так он о себе думал.',
];

const FADE_IN_MS = 1200;
const HOLD_MS = 2400;
const FADE_OUT_MS = 800;
const PAUSE_MS = 500;

export class IntroScene extends Phaser.Scene {
  private introText!: Phaser.GameObjects.Text;
  private lineIndex = 0;
  private canSkip = false;
  private isAnimating = false;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x050507);

    this.introText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'serif',
        fontSize: '22px',
        color: '#8a8a8a',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const skipHint = this.add
      .text(GAME_WIDTH - 40, GAME_HEIGHT - 30, 'пропустить', {
        fontFamily: 'serif',
        fontSize: '13px',
        color: '#333333',
      })
      .setOrigin(1, 1)
      .setAlpha(0);

    this.tweens.add({
      targets: skipHint,
      alpha: 0.5,
      duration: 2000,
      delay: 3000,
    });

    this.time.delayedCall(1000, () => {
      this.canSkip = true;
    });

    this.input.on('pointerdown', () => {
      if (!this.canSkip) return;
      if (this.isAnimating) {
        this.skipToEnd();
      }
    });

    this.input.keyboard?.on('keydown', () => {
      if (!this.canSkip) return;
      if (this.isAnimating) {
        this.skipToEnd();
      }
    });

    this.lineIndex = 0;
    this.isAnimating = true;
    this.showNextLine();
  }

  private showNextLine(): void {
    if (this.lineIndex >= INTRO_LINES.length) {
      this.transitionOut();
      return;
    }

    this.introText.setText(INTRO_LINES[this.lineIndex]);
    this.introText.setAlpha(0);

    this.tweens.add({
      targets: this.introText,
      alpha: 1,
      duration: FADE_IN_MS,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.time.delayedCall(HOLD_MS, () => {
          this.tweens.add({
            targets: this.introText,
            alpha: 0,
            duration: FADE_OUT_MS,
            ease: 'Sine.easeOut',
            onComplete: () => {
              this.lineIndex++;
              this.time.delayedCall(PAUSE_MS, () => {
                this.showNextLine();
              });
            },
          });
        });
      },
    });
  }

  private transitionOut(): void {
    this.isAnimating = false;

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setAlpha(0)
      .setDepth(50);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 800,
      onComplete: () => {
        this.scene.start('ArrivalWalkScene');
      },
    });
  }

  private skipToEnd(): void {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.transitionOut();
  }
}
