import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config';

/** Dev: `?debugPos=1` — редактор хитбоксов на кадре (не для стрелок/?). */
export function isDebugPosEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const q = new URLSearchParams(window.location.search).get('debugPos')?.toLowerCase();
  return q === '1' || q === 'true' || q === 'yes';
}

export type TextureHitboxUV = {
  id: string;
  u: number;
  v: number;
  du: number;
  dv: number;
};

export function screenToTextureUV(
  bg: Phaser.GameObjects.Image,
  worldX: number,
  worldY: number,
): { u: number; v: number } {
  const sc = coverScale(bg);
  const dx = worldX - GAME_WIDTH / 2;
  const dy = worldY - GAME_HEIGHT / 2;
  return {
    u: 0.5 + dx / (bg.width * sc),
    v: 0.5 + dy / (bg.height * sc),
  };
}

function coverScale(bg: Phaser.GameObjects.Image): number {
  return Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function uvToScreenRect(
  bg: Phaser.GameObjects.Image,
  u: number,
  v: number,
  du: number,
  dv: number,
): { x: number; y: number; w: number; h: number } {
  const sc = coverScale(bg);
  const cx = GAME_WIDTH / 2 + (u - 0.5) * bg.width * sc;
  const cy = GAME_HEIGHT / 2 + (v - 0.5) * bg.height * sc;
  return {
    x: cx,
    y: cy,
    w: du * 2 * bg.width * sc,
    h: dv * 2 * bg.height * sc,
  };
}

function uvDragToHitbox(
  bg: Phaser.GameObjects.Image,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): TextureHitboxUV | null {
  const a = screenToTextureUV(bg, x1, y1);
  const b = screenToTextureUV(bg, x2, y2);
  const uMin = Math.min(a.u, b.u);
  const uMax = Math.max(a.u, b.u);
  const vMin = Math.min(a.v, b.v);
  const vMax = Math.max(a.v, b.v);
  const du = (uMax - uMin) / 2;
  const dv = (vMax - vMin) / 2;
  if (du < 0.008 || dv < 0.008) return null;
  return {
    id: '',
    u: round3((uMin + uMax) / 2),
    v: round3((vMin + vMax) / 2),
    du: round3(du),
    dv: round3(dv),
  };
}

function formatHotspotsCode(boxes: TextureHitboxUV[]): string {
  const lines = boxes.map(
    (h) => `  { id: '${h.id}', u: ${h.u}, v: ${h.v}, du: ${h.du}, dv: ${h.dv} },`,
  );
  return `const HOTSPOTS = [\n${lines.join('\n')}\n];`;
}

/**
 * Редактор зон клика на текстуре.
 * Shift + протяни мышь = новый хитбокс · Z = отменить · C = всё в консоль.
 */
export function enableDebugPositionPicker(
  scene: Phaser.Scene,
  bg: Phaser.GameObjects.Image,
  sceneLabel?: string,
): void {
  if (!isDebugPosEnabled()) return;

  const label = sceneLabel ?? scene.scene.key;
  const texW = Math.round(bg.width);
  const texH = Math.round(bg.height);

  const boxes: TextureHitboxUV[] = [];
  const boxGfx: Phaser.GameObjects.Graphics[] = [];
  const boxLabels: Phaser.GameObjects.Text[] = [];
  let nextId = 1;

  let dragStart: { x: number; y: number } | null = null;
  const preview = scene.add.graphics().setDepth(10002);

  const banner = scene.add
    .text(
      GAME_WIDTH / 2,
      10,
      [
        `[debugPos] ${label} · ${texW}×${texH}`,
        'Shift+тяни = хитбокс  |  Z = отмена  |  C = код в консоль',
      ].join('\n'),
      {
        fontFamily: '"VT323", "Courier New", monospace',
        fontSize: '18px',
        color: '#e8d4a8',
        backgroundColor: '#1a1208dd',
        padding: { x: 10, y: 6 },
        align: 'center',
        lineSpacing: 4,
      },
    )
    .setOrigin(0.5, 0)
    .setDepth(10000);

  const drawPreview = (x1: number, y1: number, x2: number, y2: number): void => {
    preview.clear();
    preview.lineStyle(2, 0x5ee85a, 0.95);
    preview.fillStyle(0x5ee85a, 0.15);
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    preview.fillRect(left, top, w, h);
    preview.strokeRect(left, top, w, h);
  };

  const drawPersistedBox = (hit: TextureHitboxUV): void => {
    const { x, y, w, h } = uvToScreenRect(bg, hit.u, hit.v, hit.du, hit.dv);
    const g = scene.add.graphics().setDepth(10001);
    g.lineStyle(2, 0x5ee85a, 0.9);
    g.fillStyle(0x5ee85a, 0.12);
    g.fillRect(x - w / 2, y - h / 2, w, h);
    g.strokeRect(x - w / 2, y - h / 2, w, h);
    boxGfx.push(g);

    const t = scene.add
      .text(x - w / 2 + 4, y - h / 2 + 2, hit.id, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#b8ffb0',
        backgroundColor: '#000000aa',
        padding: { x: 3, y: 1 },
      })
      .setDepth(10001);
    boxLabels.push(t);
  };

  const logAll = (): void => {
    if (boxes.length === 0) {
      console.log('[debugHit] пока нет зон — Shift+тяни по объекту');
      return;
    }
    console.log(`[debugHit] ${label} — ${boxes.length} зон(ы):`);
    console.log(formatHotspotsCode(boxes));
    console.log('[debugHit] JSON:', JSON.stringify(boxes, null, 2));
  };

  const removeLast = (): void => {
    if (boxes.length === 0) return;
    boxes.pop();
    boxGfx.pop()?.destroy();
    boxLabels.pop()?.destroy();
    console.log(`[debugHit] удалена последняя · осталось ${boxes.length}`);
  };

  const onPointerDown = (pointer: Phaser.Input.Pointer) => {
    const ev = pointer.event as MouseEvent | undefined;
    if (!ev?.shiftKey) return;
    dragStart = { x: pointer.worldX, y: pointer.worldY };
    preview.clear();
  };

  const onPointerMove = (pointer: Phaser.Input.Pointer) => {
    if (!dragStart) return;
    const ev = pointer.event as MouseEvent | undefined;
    if (!ev?.shiftKey) return;
    drawPreview(dragStart.x, dragStart.y, pointer.worldX, pointer.worldY);
  };

  const onPointerUp = (pointer: Phaser.Input.Pointer) => {
    if (!dragStart) return;
    const start = dragStart;
    dragStart = null;
    preview.clear();

    const ev = pointer.event as MouseEvent | undefined;
    if (!ev?.shiftKey) return;

    const hit = uvDragToHitbox(bg, start.x, start.y, pointer.worldX, pointer.worldY);
    if (!hit) {
      console.log('[debugHit] зона слишком мелкая — протяни побольше');
      return;
    }

    hit.id = `hit${nextId++}`;
    boxes.push(hit);
    drawPersistedBox(hit);
    console.log(
      `[debugHit] +${hit.id}  u=${hit.u} v=${hit.v} du=${hit.du} dv=${hit.dv}`,
    );
    console.log(`  { id: '${hit.id}', u: ${hit.u}, v: ${hit.v}, du: ${hit.du}, dv: ${hit.dv} },`);
  };

  const onKeyC = (): void => logAll();
  const onKeyZ = (): void => removeLast();

  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', onPointerUp);
  scene.input.keyboard?.on('keydown-C', onKeyC);
  scene.input.keyboard?.on('keydown-Z', onKeyZ);

  console.log(
    `[debugHit] ${label}: Shift+drag = хитбокс, C = экспорт, Z = отмена (${texW}×${texH})`,
  );

  scene.events.once('shutdown', () => {
    scene.input.off('pointerdown', onPointerDown);
    scene.input.off('pointermove', onPointerMove);
    scene.input.off('pointerup', onPointerUp);
    scene.input.keyboard?.off('keydown-C', onKeyC);
    scene.input.keyboard?.off('keydown-Z', onKeyZ);
    banner.destroy();
    preview.destroy();
    for (const g of boxGfx) g.destroy();
    for (const t of boxLabels) t.destroy();
  });
}
