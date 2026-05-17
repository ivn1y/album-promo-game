import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import {
  DIALOG_BG,
  DIALOG_BG_ALPHA,
  DIALOG_BODY_COLOR,
  DIALOG_BODY_SIZE,
  DIALOG_BORDER,
  DIALOG_BORDER_ALPHA,
  DIALOG_FONT,
  DIALOG_INNER_BORDER,
  DIALOG_INNER_W,
  DIALOG_MARGIN_BOTTOM,
  DIALOG_PAD_X,
  DIALOG_PAD_Y,
  DIALOG_PANEL_W,
  DIALOG_SPEAKER_COLOR,
  DIALOG_SPEAKER_SIZE,
} from './dialogPanelLayout';

const MIN_PANEL_H = 110;
const SPEAKER_BLOCK_H = 32;

export class TextBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private backdrop: Phaser.GameObjects.Rectangle;
  private innerStroke: Phaser.GameObjects.Rectangle;
  private speakerText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;

  private lines: { speaker: string | null; text: string }[] = [];
  private currentIndex = 0;
  private onComplete?: () => void;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.backdrop = scene.add.rectangle(0, 0, DIALOG_PANEL_W, MIN_PANEL_H, DIALOG_BG, DIALOG_BG_ALPHA);
    this.backdrop.setStrokeStyle(2, DIALOG_BORDER, DIALOG_BORDER_ALPHA);

    this.innerStroke = scene.add
      .rectangle(0, 0, DIALOG_PANEL_W - 8, MIN_PANEL_H - 8, 0x000000, 0)
      .setStrokeStyle(1, DIALOG_INNER_BORDER, 0.6);

    this.speakerText = scene.add.text(-DIALOG_PANEL_W / 2 + DIALOG_PAD_X, 0, '', {
      fontFamily: DIALOG_FONT,
      fontSize: DIALOG_SPEAKER_SIZE,
      color: DIALOG_SPEAKER_COLOR,
    });

    this.bodyText = scene.add.text(-DIALOG_PANEL_W / 2 + DIALOG_PAD_X, 0, '', {
      fontFamily: DIALOG_FONT,
      fontSize: DIALOG_BODY_SIZE,
      color: DIALOG_BODY_COLOR,
      lineSpacing: 6,
      wordWrap: { width: DIALOG_INNER_W },
    });

    this.hint = scene.add
      .text(DIALOG_PANEL_W / 2 - DIALOG_PAD_X - 4, 0, '▶', {
        fontFamily: DIALOG_FONT,
        fontSize: '22px',
        color: '#6a6258',
      })
      .setOrigin(1, 1);

    this.container = scene.add.container(GAME_WIDTH / 2, 0, [
      this.backdrop,
      this.innerStroke,
      this.speakerText,
      this.bodyText,
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
    this.bodyText.setText(line.text);

    const contentH =
      DIALOG_PAD_Y * 2 +
      (hasSpeaker ? SPEAKER_BLOCK_H : 0) +
      this.bodyText.height +
      8;
    const boxH = Math.max(MIN_PANEL_H, contentH);

    this.backdrop.setSize(DIALOG_PANEL_W, boxH);
    this.innerStroke.setSize(DIALOG_PANEL_W - 8, boxH - 8);

    const cy = GAME_HEIGHT - DIALOG_MARGIN_BOTTOM - boxH / 2;
    this.container.setY(cy);

    this.speakerText.setY(-boxH / 2 + DIALOG_PAD_Y);
    this.bodyText.setY(
      hasSpeaker ? -boxH / 2 + DIALOG_PAD_Y + SPEAKER_BLOCK_H : -boxH / 2 + DIALOG_PAD_Y,
    );
    this.hint.setPosition(DIALOG_PANEL_W / 2 - DIALOG_PAD_X - 4, boxH / 2 - DIALOG_PAD_Y);

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
