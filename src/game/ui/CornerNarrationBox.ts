import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config';

const FONT = '"VT323", "Courier New", monospace';

/** Плашка-заглушка под нарратив слева снизу; позже можно заменить на финальный UI. */
const MARGIN_LEFT = 22;
const MARGIN_BOTTOM = 22;
const PANEL_W = 720;
const PANEL_H = 186;
const PAD_X = 18;
const PAD_Y = 12;

export class CornerNarrationBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private speakerText: Phaser.GameObjects.Text;
  private divider: Phaser.GameObjects.Rectangle;
  private bodyText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private lines: { speaker: string | null; text: string }[] = [];
  private index = 0;
  private onComplete?: () => void;
  private active = false;
  private pointerHandler: (p: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const cx = MARGIN_LEFT + PANEL_W / 2;
    const cy = GAME_HEIGHT - MARGIN_BOTTOM - PANEL_H / 2;
    const left = MARGIN_LEFT;
    const top = cy - PANEL_H / 2;

    const bg = scene.add.rectangle(cx, cy, PANEL_W, PANEL_H, 0x0c0c14, 0.94).setStrokeStyle(1, 0x4a4336);

    this.speakerText = scene.add.text(left + PAD_X, top + PAD_Y, '', {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#c4a35a',
    });

    this.divider = scene.add.rectangle(cx, top + PAD_Y + 26, PANEL_W - PAD_X * 2, 1, 0x3a3530, 1);

    this.bodyText = scene.add.text(left + PAD_X, top + PAD_Y + 34, '', {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#c8c4bc',
      lineSpacing: 4,
      wordWrap: { width: PANEL_W - PAD_X * 2 },
    });

    this.hint = scene.add
      .text(left + PANEL_W - PAD_X - 8, top + PANEL_H - PAD_Y - 6, '▶', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#6a6258',
      })
      .setOrigin(1, 1);

    this.container = scene.add.container(0, 0, [bg, this.speakerText, this.divider, this.bodyText, this.hint]);
    this.container.setDepth(40);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    this.pointerHandler = () => {
      if (!this.active) return;
      this.advance();
    };
    scene.input.on('pointerdown', this.pointerHandler);
  }

  show(lines: { speaker: string | null; text: string }[], onComplete?: () => void): void {
    this.lines = lines;
    this.index = 0;
    this.onComplete = onComplete;
    this.active = true;
    this.container.setVisible(true);
    this.renderLine();

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 280,
      ease: 'Sine.easeOut',
    });

    this.scene.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(0.55);
    this.scene.tweens.add({
      targets: this.hint,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  isActive(): boolean {
    return this.active;
  }

  private advance(): void {
    this.index++;
    if (this.index >= this.lines.length) {
      const cb = this.onComplete;
      this.onComplete = undefined;
      this.hide(cb);
      return;
    }
    this.renderLine();
  }

  private renderLine(): void {
    const line = this.lines[this.index];
    const hasSpeaker = line.speaker !== null && line.speaker.length > 0;
    this.speakerText.setText(hasSpeaker ? line.speaker! : '');
    this.speakerText.setVisible(hasSpeaker);
    this.divider.setVisible(hasSpeaker);
    this.bodyText.setText(line.text);

    const top = GAME_HEIGHT - MARGIN_BOTTOM - PANEL_H;
    this.bodyText.setY(hasSpeaker ? top + PAD_Y + 34 : top + PAD_Y + 10);

    const isLast = this.index >= this.lines.length - 1;
    this.hint.setText(isLast ? '✕' : '▶');
  }

  private hide(onDone?: () => void): void {
    this.active = false;
    this.scene.tweens.killTweensOf(this.hint);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.container.setVisible(false);
        onDone?.();
      },
    });
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.pointerHandler);
    this.container.destroy();
  }
}
