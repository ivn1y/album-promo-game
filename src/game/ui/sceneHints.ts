import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export type HintGlyph = '?' | '▼' | '▶' | '◀';

export type SceneHintSpec = {
  id: string;
  glyph: HintGlyph;
  u: number;
  v: number;
  fontSize: number;
  /** Смещение по Y от якоря (px). Потом заменишь на свой спрайт/анимацию. */
  offsetY?: number;
};

const FONT = '"VT323", "Courier New", monospace';

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

/** Временная отрисовка подсказки по данным из debugHints — потом заменишь на свой арт. */
export function spawnSceneHint(
  scene: Phaser.Scene,
  bg: Phaser.GameObjects.Image,
  spec: SceneHintSpec,
  depth = 54,
): Phaser.GameObjects.Text {
  const { x, y } = uvToScreen(bg, spec.u, spec.v);
  return scene.add
    .text(x, y + (spec.offsetY ?? 0), spec.glyph, {
      fontFamily: FONT,
      fontSize: `${spec.fontSize}px`,
      color: '#c4a35a',
      stroke: '#000000',
      strokeThickness: Math.max(3, Math.round(spec.fontSize / 8)),
    })
    .setOrigin(0.5)
    .setDepth(depth);
}

/** Лёгкое «дыхание» — для ▼ лучше down: true. */
export function addHintPulse(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Text,
  dy = 6,
  down = false,
): void {
  const baseY = target.y;
  scene.tweens.add({
    targets: target,
    y: down ? baseY + dy : baseY - dy,
    alpha: 0.55,
    duration: down ? 900 : 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
