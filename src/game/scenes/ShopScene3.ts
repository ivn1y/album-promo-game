import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { CornerNarrationBox } from '../ui/CornerNarrationBox';
import { showVerticalSliceEndCard } from '../showVerticalSliceEndCard';
import { enableDebugPositionPicker } from '../devDebugPos';
import { enableDebugHintPicker } from '../devDebugHints';
import { addHintPulse, spawnSceneHint, type SceneHintSpec } from '../ui/sceneHints';

const FONT = '"VT323", "Courier New", monospace';

type HotspotId = 'hit2' | 'hit3' | 'hit4' | 'hit5';
type ExamineHotspotId = 'hit3' | 'hit4';

/** Зоны клика scene3lvl01 (2752×1536) — расставлены через ?debugPos=1 */
const SHOP3_HOTSPOTS: { id: HotspotId; u: number; v: number; du: number; dv: number }[] = [
  { id: 'hit2', u: 0.356, v: 0.615, du: 0.047, dv: 0.244 },
  { id: 'hit3', u: 0.449, v: 0.72, du: 0.044, dv: 0.163 },
  { id: 'hit4', u: 0.532, v: 0.834, du: 0.038, dv: 0.067 },
  { id: 'hit5', u: 0.281, v: 0.659, du: 0.027, dv: 0.218 },
];

/** Подсказки (debugHints) — потом заменишь glyph на свой спрайт. */
const SCENE_HINTS: SceneHintSpec[] = [
  { id: 'hint3', glyph: '▼', u: 0.362, v: 0.319, fontSize: 40 },
];

/** Куда смотрит ▼ hint3 — диалог с бомжом. */
const BOMZH_HOTSPOTS: HotspotId[] = ['hit2', 'hit5'];

const BOMZH_DIALOGUE = [
  { speaker: null, text: 'За дверью — узкий двор и запах сырости. У стены сидит человек в лохмотьях.' },
  { speaker: 'Бродяга', text: 'Не кричите... Хозяин лавки гонит всех подряд, а я тут сижу — мне некуда.' },
  { speaker: 'Бродяга', text: 'Ночью слышал, как тащили мешки к канаве. Шаги были тяжёлые, будто несли муку или камень.' },
  { speaker: 'Помощник', text: 'Если он прав, грабители уходили не только через витрину. Запишем и проверим след у канавы.' },
];

const EXAMINE_LINES: Record<'hit3' | 'hit4', { speaker: string | null; text: string }[]> = {
  hit3: [
    {
      speaker: 'Помощник',
      text: 'Мешки сдвинуты недавно: солома свежая, пыль на полу размазана в сторону двора.',
    },
  ],
  hit4: [
    {
      speaker: null,
      text: 'Ящик пустой, но на крышке — влажный след ладони и крошки теста.',
    },
  ],
};

function texFracToScreen(
  bg: Phaser.GameObjects.Image,
  u: number,
  v: number,
): { x: number; y: number; sc: number } {
  const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
  const dx = (u - 0.5) * bg.width * sc;
  const dy = (v - 0.5) * bg.height * sc;
  return { x: GAME_WIDTH / 2 + dx, y: GAME_HEIGHT / 2 + dy, sc };
}

/** За дверью лавки (scene3lvl01): хитбоксы + диалог с бомжом (▼ → hit2 / hit5). */
export class ShopScene3 extends Phaser.Scene {
  private cornerBox?: CornerNarrationBox;
  private hotspotRects: Phaser.GameObjects.Rectangle[] = [];
  private sceneHintTexts: Phaser.GameObjects.Text[] = [];
  private bomzhTalked = false;
  private examined = new Set<ExamineHotspotId>();
  private hotspotById = new Map<HotspotId, Phaser.GameObjects.Rectangle>();

  constructor() {
    super({ key: 'ShopScene3' });
  }

  preload(): void {
    if (!this.textures.exists('shop_scene3_bg')) {
      this.load.image('shop_scene3_bg', '/assets/scenes/level01/scene3lvl01.jpg');
    }
  }

  create(): void {
    this.bomzhTalked = false;
    this.examined.clear();
    this.hotspotRects = [];
    this.hotspotById.clear();
    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('shop_scene3_bg')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузилась сцена 3', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'shop_scene3_bg');
    const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(sc).setDepth(0);
    enableDebugPositionPicker(this, bg);
    enableDebugHintPicker(this, bg);

    this.cornerBox = new CornerNarrationBox(this);
    this.events.once('shutdown', () => {
      this.cornerBox?.destroy();
      this.cornerBox = undefined;
      this.clearHotspots();
      this.hideSceneHints();
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.cameras.main.once('camerafadeincomplete', () => {
      this.startHotspots(bg);
    });
  }

  private clearHotspots(): void {
    for (const r of this.hotspotRects) {
      r.destroy();
    }
    this.hotspotRects = [];
    this.hotspotById.clear();
  }

  private startHotspots(bg: Phaser.GameObjects.Image): void {
    for (const h of SHOP3_HOTSPOTS) {
      const { x, y, sc } = texFracToScreen(bg, h.u, h.v);
      const w = h.du * 2 * bg.width * sc;
      const hh = h.dv * 2 * bg.height * sc;

      const rect = this.add
        .rectangle(x, y, w, hh, 0xffffff, 0)
        .setDepth(52)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onHotspot(h.id, rect));

      this.hotspotRects.push(rect);
      this.hotspotById.set(h.id, rect);
    }

    if (!this.bomzhTalked) {
      this.spawnSceneHints(bg);
    }
  }

  private spawnSceneHints(bg: Phaser.GameObjects.Image): void {
    for (const spec of SCENE_HINTS) {
      const t = spawnSceneHint(this, bg, spec, 54);
      t.setAlpha(0);
      this.tweens.add({
        targets: t,
        alpha: 1,
        duration: 450,
        ease: 'Sine.easeOut',
      });
      if (spec.glyph === '▼') {
        addHintPulse(this, t, 8, true);
      } else {
        addHintPulse(this, t);
      }
      this.sceneHintTexts.push(t);
    }
  }

  private hideSceneHints(): void {
    for (const t of this.sceneHintTexts) {
      this.tweens.killTweensOf(t);
      t.destroy();
    }
    this.sceneHintTexts = [];
  }

  private onHotspot(id: HotspotId, rect: Phaser.GameObjects.Rectangle): void {
    if (this.cornerBox?.isActive()) return;

    if (BOMZH_HOTSPOTS.includes(id)) {
      this.startBomzhDialogue(rect);
      return;
    }

    if (id !== 'hit3' && id !== 'hit4') return;
    if (this.examined.has(id)) return;
    this.examined.add(id);
    rect.disableInteractive();
    this.cornerBox?.show(EXAMINE_LINES[id]);
  }

  private startBomzhDialogue(_rect: Phaser.GameObjects.Rectangle): void {
    if (this.bomzhTalked) return;
    this.bomzhTalked = true;
    this.hideSceneHints();

    for (const id of BOMZH_HOTSPOTS) {
      this.hotspotById.get(id)?.disableInteractive();
    }

    this.cornerBox?.show(BOMZH_DIALOGUE, () => {
      this.waitForExitClick();
    });
  }

  private waitForExitClick(): void {
    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'клик — дальше', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#5c564c',
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setAlpha(0);

    this.tweens.add({ targets: hint, alpha: 1, duration: 400, delay: 200 });

    const hit = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(55)
      .setInteractive({ useHandCursor: true });

    hit.once('pointerdown', () => {
      hint.destroy();
      hit.destroy();
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        showVerticalSliceEndCard(this);
      });
    });
  }
}
