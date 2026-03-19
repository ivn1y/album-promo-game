import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const BOX_HEIGHT = 130;
const BOX_MARGIN_BOTTOM = 20;
const BOX_MARGIN_X = 30;

export class TextBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private speakerText: Phaser.GameObjects.Text;
  private divider: Phaser.GameObjects.Rectangle;
  private lineText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;

  private lines: { speaker: string | null; text: string }[] = [];
  private currentIndex = 0;
  private onComplete?: () => void;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const boxW = GAME_WIDTH - BOX_MARGIN_X * 2;
    const boxY = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN_BOTTOM;
    const cx = GAME_WIDTH / 2;
    const cy = boxY + BOX_HEIGHT / 2;

    this.bg = scene.add.rectangle(cx, cy, boxW, BOX_HEIGHT, 0x0c0c14, 0.92);

    this.border = scene.add
      .rectangle(cx, cy, boxW, BOX_HEIGHT)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(1, 0x3a3a4a);

    this.speakerText = scene.add.text(BOX_MARGIN_X + 22, boxY + 14, '', {
      fontFamily: 'serif',
      fontSize: '15px',
      color: '#c4a35a',
    });

    this.divider = scene.add
      .rectangle(cx, boxY + 36, boxW - 44, 1, 0x333344, 0.5);

    this.lineText = scene.add.text(BOX_MARGIN_X + 22, boxY + 46, '', {
      fontFamily: 'serif',
      fontSize: '19px',
      color: '#d4d4d4',
      lineSpacing: 6,
      wordWrap: { width: boxW - 80 },
    });

    this.hint = scene.add
      .text(GAME_WIDTH - BOX_MARGIN_X - 30, boxY + BOX_HEIGHT - 24, '▶', {
        fontFamily: 'serif',
        fontSize: '13px',
        color: '#555555',
      })
      .setOrigin(0.5);

    this.container = scene.add.container(0, 0, [
      this.bg,
      this.border,
      this.speakerText,
      this.divider,
      this.lineText,
      this.hint,
    ]);
    this.container.setDepth(100);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    scene.input.on('pointerdown', () => {
      if (!this.active) return;
      this.advance();
    });
  }

  show(
    lines: { speaker: string | null; text: string }[],
    onComplete?: () => void,
  ): void {
    this.lines = lines;
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.active = true;
    this.container.setVisible(true);
    this.renderCurrent();

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
    });
  }

  showSingle(text: string, onComplete?: () => void): void {
    this.show([{ speaker: null, text }], onComplete);
  }

  isActive(): boolean {
    return this.active;
  }

  private advance(): void {
    this.currentIndex++;
    if (this.currentIndex >= this.lines.length) {
      const cb = this.onComplete;
      this.onComplete = undefined;
      this.hide(cb);
      return;
    }
    this.renderCurrent();
  }

  private renderCurrent(): void {
    const line = this.lines[this.currentIndex];
    const hasSpeaker = line.speaker !== null && line.speaker.length > 0;

    this.speakerText.setText(hasSpeaker ? line.speaker! : '');
    this.speakerText.setVisible(hasSpeaker);
    this.divider.setVisible(hasSpeaker);
    this.lineText.setText(line.text);

    const boxY = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN_BOTTOM;
    this.lineText.setY(hasSpeaker ? boxY + 46 : boxY + 24);

    const isLast = this.currentIndex >= this.lines.length - 1;
    this.hint.setText(isLast ? '✕' : '▶');

    this.scene.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(0.6);
    this.scene.tweens.add({
      targets: this.hint,
      alpha: 0.2,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  hide(onDone?: () => void): void {
    this.active = false;
    this.scene.tweens.killTweensOf(this.hint);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.container.setVisible(false);
        onDone?.();
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
