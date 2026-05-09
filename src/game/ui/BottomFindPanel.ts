import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

/** Как на референсе hidden-object: обычный, найден (зачёркнут), акцент (красный). */
export type FindItemState = 'active' | 'found' | 'highlight';

export type FindPanelItem =
  | string
  | {
      label: string;
      state?: FindItemState;
    };

export type BottomFindPanelSpec = {
  items: FindPanelItem[];
};

export type BottomFindPanelShowOpts = {
  /** Повторный вызов без мигания (обновление списка). */
  skipFade?: boolean;
};

const FONT_UI =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const MARGIN_TOP = 10;
const PANEL_W = 520;
const PAD_TOP = 14;
const PAD_BOTTOM = 16;
const COLS = 3;
const FONT_SIZE = 11;
const ROW_GAP = 7;
const BG = 0x0b0b0c;
const BG_ALPHA = 0.88;
const BORDER = 0xc4a052;
const COLOR_ACTIVE = '#f2f2f2';
const COLOR_FOUND = '#8a8a8a';
const COLOR_HIGHLIGHT = '#e62828';

const CORNER_R: Phaser.Types.GameObjects.Graphics.RoundedRectRadius = {
  tl: 0,
  tr: 0,
  bl: 0,
  br: 0,
};

function normalize(raw: FindPanelItem): { label: string; state: FindItemState } {
  if (typeof raw === 'string') {
    const label = raw.trim();
    return { label, state: 'active' };
  }
  return { label: raw.label.trim(), state: raw.state ?? 'active' };
}

/**
 * Верхняя плашка «что найти»: узкая, по центру, 3 колонки, перенос внутри колонки, прямоугольная рамка.
 */
export class BottomFindPanel {
  private scene: Phaser.Scene;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(spec: BottomFindPanelSpec, opts?: BottomFindPanelShowOpts): void {
    this.destroy();

    let entries = spec.items.map(normalize).filter((x) => x.label.length > 0);
    if (entries.length === 0) {
      entries = [{ label: '…', state: 'active' }];
    }

    const maxRows = Math.ceil(entries.length / COLS);
    const panelW = PANEL_W;
    const left = (GAME_WIDTH - panelW) / 2;
    const top = MARGIN_TOP;

    const colW = panelW / COLS;
    const wrapW = Math.max(44, colW - 14);

    const cells: { text: Phaser.GameObjects.Text; state: FindItemState }[] = [];
    let rowY = top + PAD_TOP;

    for (let row = 0; row < maxRows; row++) {
      let rowMaxH = 0;
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        if (i >= entries.length) break;

        const { label, state } = entries[i];
        const cx = left + col * colW + colW / 2;

        let color = COLOR_ACTIVE;
        if (state === 'found') color = COLOR_FOUND;
        if (state === 'highlight') color = COLOR_HIGHLIGHT;

        const txt = this.scene.add
          .text(cx, rowY, label, {
            fontFamily: FONT_UI,
            fontSize: `${FONT_SIZE}px`,
            color,
            align: 'center',
            wordWrap: { width: wrapW },
            fontStyle: state === 'highlight' ? '600' : '400',
          })
          .setOrigin(0.5, 0);

        cells.push({ text: txt, state });
        rowMaxH = Math.max(rowMaxH, txt.height);
      }
      rowY += rowMaxH;
      if (row < maxRows - 1) {
        rowY += ROW_GAP;
      }
    }

    const panelH = rowY - top + PAD_BOTTOM;

    const bg = this.scene.add.graphics();
    bg.fillStyle(BG, BG_ALPHA);
    bg.fillRoundedRect(left, top, panelW, panelH, CORNER_R);
    bg.lineStyle(2, BORDER, 1);
    bg.strokeRoundedRect(left, top, panelW, panelH, CORNER_R);

    const strikes: Phaser.GameObjects.Graphics[] = [];
    for (const { text, state } of cells) {
      if (state !== 'found') continue;
      const b = text.getBounds();
      const strike = this.scene.add.graphics();
      strike.lineStyle(1.25, 0x7a7a7a, 0.95);
      strike.lineBetween(b.left + 1, b.centerY, b.right - 1, b.centerY);
      strikes.push(strike);
    }

    this.container = this.scene.add.container(0, 0, [bg, ...cells.map((c) => c.text), ...strikes]);
    this.container.setDepth(35);
    this.container.setAlpha(opts?.skipFade ? 1 : 0);

    if (!opts?.skipFade) {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 260,
        ease: 'Sine.easeOut',
      });
    }
  }

  destroy(): void {
    this.container?.destroy(true);
    this.container = undefined;
  }
}
