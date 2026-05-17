import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';
import { screenToTextureUV } from './devDebugPos';
import type { HintGlyph, SceneHintSpec } from './ui/sceneHints';

export type { HintGlyph, SceneHintSpec } from './ui/sceneHints';

/** Dev: `?debugHints=1` — расстановка подсказок; управление кнопками на экране (удобно на Mac). */
export function isDebugHintsEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const q = new URLSearchParams(window.location.search).get('debugHints')?.toLowerCase();
  return q === '1' || q === 'true' || q === 'yes';
}

type HintKind = 'question' | 'arrowDown' | 'arrowRight' | 'arrowLeft';

const KIND_META: Record<HintKind, { glyph: HintGlyph; label: string }> = {
  question: { glyph: '?', label: '?' },
  arrowDown: { glyph: '▼', label: '▼' },
  arrowRight: { glyph: '▶', label: '▶' },
  arrowLeft: { glyph: '◀', label: '◀' },
};

const TOOLBAR_H = 118;
const UI_DEPTH = 10020;

function coverScale(bg: Phaser.GameObjects.Image): number {
  return Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
}

function uvToScreen(bg: Phaser.GameObjects.Image, u: number, v: number): { x: number; y: number } {
  const sc = coverScale(bg);
  return {
    x: GAME_WIDTH / 2 + (u - 0.5) * bg.width * sc,
    y: GAME_HEIGHT / 2 + (v - 0.5) * bg.height * sc,
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function formatHintsCode(hints: SceneHintSpec[]): string {
  const lines = hints.map((h) => {
    const off =
      h.offsetY !== undefined && h.offsetY !== 0 ? `, offsetY: ${h.offsetY}` : '';
    return `  { id: '${h.id}', glyph: '${h.glyph}', u: ${h.u}, v: ${h.v}, fontSize: ${h.fontSize}${off} },`;
  });
  return `const SCENE_HINTS: SceneHintSpec[] = [\n${lines.join('\n')}\n];`;
}

/**
 * Панель сверху + клик по кадру (без Shift). Mac: клавиши E = в консоль, Delete = отмена.
 */
export function enableDebugHintPicker(
  scene: Phaser.Scene,
  bg: Phaser.GameObjects.Image,
  sceneLabel?: string,
): void {
  if (!isDebugHintsEnabled()) return;

  const label = sceneLabel ?? scene.scene.key;
  const texW = Math.round(bg.width);
  const texH = Math.round(bg.height);

  const hints: SceneHintSpec[] = [];
  const visuals: Phaser.GameObjects.GameObject[] = [];
  const uiNodes: Phaser.GameObjects.GameObject[] = [];
  let nextId = 1;
  let kind: HintKind = 'question';
  let fontSize = 28;
  let offsetY = 0;
  let placeMode = true;

  let statusText!: Phaser.GameObjects.Text;
  let modeBtnLabel!: Phaser.GameObjects.Text;
  let sizeValText!: Phaser.GameObjects.Text;
  let offYValText!: Phaser.GameObjects.Text;
  const kindBtnBgs: Partial<Record<HintKind, Phaser.GameObjects.Rectangle>> = {};

  const refreshStatus = (): void => {
    const m = KIND_META[kind];
    statusText.setText(
      `${m.glyph} · ${fontSize}px · Y${offsetY >= 0 ? '+' : ''}${offsetY} · в сцене: ${hints.length}`,
    );
    modeBtnLabel.setText(placeMode ? 'Режим: ВКЛ (клик = ставить)' : 'Режим: ВЫКЛ');
    sizeValText.setText(String(fontSize));
    offYValText.setText(String(offsetY));
    for (const k of Object.keys(KIND_META) as HintKind[]) {
      const r = kindBtnBgs[k];
      if (r) r.setFillStyle(k === kind ? 0x3a5a8a : 0x1a2838, k === kind ? 1 : 0.92);
    }
  };

  const spawnVisual = (h: SceneHintSpec): void => {
    const { x, y } = uvToScreen(bg, h.u, h.v);
    const ty = y + (h.offsetY ?? 0);
    const t = scene.add
      .text(x, ty, h.glyph, {
        fontFamily: '"VT323", "Courier New", monospace',
        fontSize: `${h.fontSize}px`,
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: Math.max(3, Math.round(h.fontSize / 8)),
      })
      .setOrigin(0.5)
      .setDepth(10005)
      .setAlpha(0.85);

    const tag = scene.add
      .text(x + 14, ty - 14, h.id, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#88bbff',
        backgroundColor: '#000000aa',
        padding: { x: 2, y: 1 },
      })
      .setDepth(10006);

    visuals.push(t, tag);
  };

  const logAll = (): void => {
    if (hints.length === 0) {
      console.log('[debugHints] пока нет подсказок — включи режим ВКЛ и кликни по кадру');
      return;
    }
    console.log(`[debugHints] ${label} — ${hints.length} шт.`);
    console.log(formatHintsCode(hints));
    console.log('[debugHints] JSON:', JSON.stringify(hints, null, 2));
  };

  const removeLast = (): void => {
    if (hints.length === 0) return;
    hints.pop();
    visuals.pop()?.destroy();
    visuals.pop()?.destroy();
    refreshStatus();
  };

  const placeAt = (worldX: number, worldY: number): void => {
    const { u, v } = screenToTextureUV(bg, worldX, worldY);
    const glyph = KIND_META[kind].glyph;
    const spec: SceneHintSpec = {
      id: `hint${nextId++}`,
      glyph,
      u: round3(u),
      v: round3(v),
      fontSize,
      ...(offsetY !== 0 ? { offsetY } : {}),
    };
    hints.push(spec);
    spawnVisual(spec);
    console.log(`[debugHints] +${spec.id} ${glyph} u=${spec.u} v=${spec.v}`);
    refreshStatus();
  };

  const makeBtn = (
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    onClick: () => void,
    fontSizePx = 15,
  ): void => {
    const rect = scene.add
      .rectangle(x, y, w, h, 0x1a2838, 0.95)
      .setStrokeStyle(1, 0x5a7aaa, 0.8)
      .setDepth(UI_DEPTH)
      .setInteractive({ useHandCursor: true });

    const txt = scene.add
      .text(x, y, text, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: `${fontSizePx}px`,
        color: '#e8f0ff',
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH + 1);

    const fire = (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      onClick();
    };
    rect.on('pointerdown', fire);
    txt.on('pointerdown', fire);

    uiNodes.push(rect, txt);
  };

  // --- Панель управления (кликай мышью, Shift не нужен) ---
  const panelBg = scene.add
    .rectangle(GAME_WIDTH / 2, TOOLBAR_H / 2, GAME_WIDTH, TOOLBAR_H, 0x060a12, 0.92)
    .setDepth(UI_DEPTH - 1)
    .setStrokeStyle(1, 0x3a5a8a, 0.5);
  uiNodes.push(panelBg);

  const titleText = scene.add
    .text(16, 10, `[debugHints] ${label} · ${texW}×${texH}`, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#8ab4f8',
    })
    .setDepth(UI_DEPTH + 1);
  uiNodes.push(titleText);

  statusText = scene.add
    .text(16, 30, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#c8d8f0',
    })
    .setDepth(UI_DEPTH + 1);

  uiNodes.push(statusText);

  const rowY = 54;
  const kinds: HintKind[] = ['question', 'arrowDown', 'arrowRight', 'arrowLeft'];
  let kx = 52;
  for (const k of kinds) {
    const w = 44;
    const rect = scene.add
      .rectangle(kx, rowY, w, 32, 0x1a2838, 0.95)
      .setStrokeStyle(1, 0x5a7aaa, 0.8)
      .setDepth(UI_DEPTH)
      .setInteractive({ useHandCursor: true });
    const txt = scene.add
      .text(kx, rowY, KIND_META[k].label, {
        fontFamily: '"VT323", monospace',
        fontSize: '22px',
        color: '#e8d4a8',
      })
      .setOrigin(0.5)
      .setDepth(UI_DEPTH + 1)
      .setInteractive({ useHandCursor: true });
    const pick = (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      kind = k;
      refreshStatus();
    };
    rect.on('pointerdown', pick);
    txt.on('pointerdown', pick);
    kindBtnBgs[k] = rect;
    uiNodes.push(rect, txt);
    kx += w + 8;
  }

  makeBtn(248, rowY, 36, 32, '−', () => {
    fontSize = Math.max(12, fontSize - 4);
    refreshStatus();
  });
  sizeValText = scene.add
    .text(292, rowY, '28', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff',
    })
    .setOrigin(0.5)
    .setDepth(UI_DEPTH + 1);
  uiNodes.push(sizeValText);
  makeBtn(326, rowY, 36, 32, '+', () => {
    fontSize = Math.min(72, fontSize + 4);
    refreshStatus();
  });

  makeBtn(388, rowY, 36, 32, '↑', () => {
    offsetY -= 4;
    refreshStatus();
  });
  offYValText = scene.add
    .text(432, rowY, '0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff',
    })
    .setOrigin(0.5)
    .setDepth(UI_DEPTH + 1);
  uiNodes.push(offYValText);
  makeBtn(466, rowY, 36, 32, '↓', () => {
    offsetY += 4;
    refreshStatus();
  });

  const row2 = 92;
  makeBtn(140, row2, 200, 28, '', () => {
    placeMode = !placeMode;
    refreshStatus();
  });
  modeBtnLabel = scene.add
    .text(140, row2, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      color: '#b8f0c8',
    })
    .setOrigin(0.5)
    .setDepth(UI_DEPTH + 2)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      placeMode = !placeMode;
      refreshStatus();
    });
  uiNodes.push(modeBtnLabel);

  makeBtn(360, row2, 120, 28, 'В консоль', () => logAll(), 13);
  makeBtn(490, row2, 90, 28, 'Отмена', () => removeLast(), 13);

  refreshStatus();

  const onPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (!placeMode) return;
    if (pointer.worldY < TOOLBAR_H + 4) return;
    placeAt(pointer.worldX, pointer.worldY);
  };

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key === 'e' || ev.key === 'E' || ev.key === 'у' || ev.key === 'У') {
      logAll();
      return;
    }
    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      removeLast();
    }
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.input.keyboard?.on('keydown', onKeyDown);

  console.log(
    `[debugHints] ${label}: панель сверху — кнопки мышью; клик по кадру = ставить; E = консоль; Delete = отмена`,
  );

  scene.events.once('shutdown', () => {
    scene.input.off('pointerdown', onPointerDown);
    scene.input.keyboard?.off('keydown', onKeyDown);
    for (const n of uiNodes) n.destroy();
    for (const v of visuals) v.destroy();
  });
}
