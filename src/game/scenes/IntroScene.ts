import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

/** Пролог: тон, палитра и ритм под новую концепцию (готический город, день/ночь, ветки). */
const INTRO_LINES: string[] = [
  'Город из мокрого камня и серых шпилей\nдавно научился не выдавать свои тайны.',
  'Здесь пропадали печати, письма, целые ночи —\nа преступления оставались в тени.',
  'К старым воротам подошёл молодой детектив.\nРядом, чуть сзади, — его ассистент.',
  'Днём их ждут дела, улики и разговоры.\nНочью — короткие испытания, от которых зависит слишком многое.',
  'Они ещё не знают, какой след оставит\nсамый первый из этих дней.',
];

const FONT_MAIN = '"VT323", "Courier New", monospace';
const FONT_UI = '"VT323", "Courier New", monospace';

const FADE_IN_MS = 900;
const FADE_OUT_MS = 650;
const PAUSE_BETWEEN_MS = 280;

type Phase = 'fadeIn' | 'waiting' | 'fadeOut' | 'done';

export class IntroScene extends Phaser.Scene {
  private introText!: Phaser.GameObjects.Text;
  private chapterLabel!: Phaser.GameObjects.Text;
  private skipLabel!: Phaser.GameObjects.Text;
  private progressDots: Phaser.GameObjects.Rectangle[] = [];
  private lineIndex = 0;
  private phase: Phase = 'fadeIn';
  private inputUnlocked = false;
  private sequenceStarted = false;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    this.buildUi();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.inputUnlocked) this.transitionOut();
    });

    this.input.on('pointerdown', () => {
      if (!this.inputUnlocked) return;
      this.onAdvanceRequest();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.inputUnlocked) return;
      this.onAdvanceRequest();
    });

    void document.fonts?.ready?.then(() => this.queueBeginSequence());
    this.time.delayedCall(400, () => this.queueBeginSequence());
  }

  private queueBeginSequence(): void {
    if (this.sequenceStarted) return;
    this.sequenceStarted = true;
    this.beginSequence();
  }

  private buildUi(): void {
    this.chapterLabel = this.add
      .text(GAME_WIDTH / 2, 72, 'ПРОЛОГ', {
        fontFamily: FONT_UI,
        fontSize: '26px',
        color: '#5a5a5a',
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    this.introText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, '', {
        fontFamily: FONT_MAIN,
        fontSize: '38px',
        color: '#b8b0a8',
        align: 'center',
        lineSpacing: 8,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(11);

    const dotCount = INTRO_LINES.length;
    const gap = 14;
    const dotW = 8;
    const totalW = dotCount * dotW + (dotCount - 1) * gap;
    const startX = GAME_WIDTH / 2 - totalW / 2 + dotW / 2;

    for (let i = 0; i < dotCount; i++) {
      const dot = this.add
        .rectangle(startX + i * (dotW + gap), GAME_HEIGHT - 48, dotW, dotW, 0x3a3228, 0.35)
        .setStrokeStyle(1, 0x5c4f3a, 0.5)
        .setDepth(11);
      this.progressDots.push(dot);
    }

    this.skipLabel = this.add
      .text(GAME_WIDTH - 28, GAME_HEIGHT - 26, 'пропустить — Esc', {
        fontFamily: FONT_UI,
        fontSize: '22px',
        color: '#444444',
      })
      .setOrigin(1, 1)
      .setAlpha(0)
      .setDepth(12);

    const advanceHint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 78, 'клик или пробел — следующая строка', {
        fontFamily: FONT_UI,
        fontSize: '22px',
        color: '#444444',
      })
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setDepth(12);

    this.tweens.add({
      targets: [this.skipLabel, advanceHint],
      alpha: 0.65,
      duration: 1400,
      delay: 2200,
    });
  }

  private beginSequence(): void {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.tweens.add({
      targets: this.chapterLabel,
      alpha: 1,
      duration: 900,
      delay: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.inputUnlocked = true;
        this.lineIndex = 0;
        this.startLine(0);
      },
    });
  }

  private setProgress(index: number): void {
    this.progressDots.forEach((dot, i) => {
      const active = i === index;
      dot.setFillStyle(active ? 0xc4a35a : 0x3a3228, active ? 0.85 : 0.28);
      dot.setStrokeStyle(1, active ? 0xe8d4a8 : 0x5c4f3a, active ? 0.9 : 0.4);
    });
  }

  private onAdvanceRequest(): void {
    if (this.phase === 'waiting') {
      this.phase = 'fadeOut';
      this.tweens.killTweensOf(this.introText);
      this.tweens.add({
        targets: this.introText,
        alpha: 0,
        duration: FADE_OUT_MS * 0.55,
        ease: 'Sine.easeIn',
        onComplete: () => this.afterLineFadeOut(),
      });
      return;
    }

    if (this.phase === 'fadeIn') {
      this.tweens.killTweensOf(this.introText);
      this.introText.setAlpha(1);
      this.phase = 'waiting';
    }
  }

  private startLine(index: number): void {
    if (index >= INTRO_LINES.length) {
      this.transitionOut();
      return;
    }

    this.lineIndex = index;
    this.setProgress(index);
    this.phase = 'fadeIn';

    this.introText.setText(INTRO_LINES[index]);
    this.introText.setAlpha(0);

    this.tweens.add({
      targets: this.introText,
      alpha: 1,
      duration: FADE_IN_MS,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.phase === 'fadeIn') {
          this.phase = 'waiting';
        }
      },
    });
  }

  private afterLineFadeOut(): void {
    this.time.delayedCall(PAUSE_BETWEEN_MS, () => {
      this.startLine(this.lineIndex + 1);
    });
  }

  private transitionOut(): void {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.inputUnlocked = false;

    this.tweens.killAll();

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 4, GAME_HEIGHT + 4, 0x080604)
      .setAlpha(0)
      .setDepth(100);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 900,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.scene.start('CityDistantScene');
      },
    });
  }
}
