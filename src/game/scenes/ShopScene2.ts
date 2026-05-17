import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { CornerNarrationBox } from '../ui/CornerNarrationBox';
import { BottomFindPanel, type FindPanelItem } from '../ui/BottomFindPanel';
import { enableDebugPositionPicker } from '../devDebugPos';
import { enableDebugHintPicker } from '../devDebugHints';

const FONT = '"VT323", "Courier New", monospace';

const SHOP_SCENE2_LINES = [
  {
    speaker: 'Помощник',
    text: 'Полки полупустые, но порядок на полу выдаёт суету после взлома. Следы грязи тянутся к задней двери — будто кто-то тащил мешки.',
  },
  {
    speaker: null,
    text: 'Воздух тёплый от печи и пахнет мукой. Здесь стоит осмотреть всё по кругу, пока хозяин не начал снова кричать с улицы.',
  },
];

/** Короткий обмен перед стрелкой на дверь (после всех находок). */
const SHOP_SCENE2_BEFORE_DOOR_LINES = [
  {
    speaker: 'Помощник',
    text: 'Всё, что отмечали, на месте. Картина складывается: тянули к задку тяжёлое, мешаясь у печи.',
  },
  {
    speaker: null,
    text: 'За дверью пахнет холодом подвала. Если след не оборвался — продолжим там.',
  },
];

type ClueId = 'bread1' | 'bread2' | 'boot' | 'rag';

/**
 * Зоны клика (2752×1536). Два хлеба на РАЗНЫХ полках по высоте: верхняя (меньше v) и ниже.
 */
const SHOP2_HOTSPOTS: { clueId: ClueId; u: number; v: number; du: number; dv: number }[] = [
  { clueId: 'bread1', u: 0.218, v: 0.4, du: 0.036, dv: 0.056 },
  { clueId: 'bread2', u: 0.228, v: 0.56, du: 0.036, dv: 0.058 },
  { clueId: 'rag', u: 0.712, v: 0.49, du: 0.065, dv: 0.085 },
  { clueId: 'boot', u: 0.866, v: 0.838, du: 0.038, dv: 0.036 },
];

/** Дверь в глубину кадра — стрелка после всех находок. */
const DOOR_ARROW_U = 0.91;
const DOOR_ARROW_V = 0.46;
const DOOR_HIT_W = 110;
const DOOR_HIT_H = 220;

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

function buildFindItems(found: Record<ClueId, boolean>): FindPanelItem[] {
  const row = (id: ClueId, label: string): FindPanelItem =>
    found[id] ? { label, state: 'found' } : label;
  return [
    row('bread1', 'Пропавший хлеб'),
    row('bread2', 'Пропавший хлеб'),
    row('boot', 'След от ботинок'),
    row('rag', 'Белая тряпка'),
  ];
}

/** Лавка изнутри (scene2lvl1new): поиск улик → дверь → сцена 3. */
export class ShopScene2 extends Phaser.Scene {
  private cornerBox?: CornerNarrationBox;
  private findPanel?: BottomFindPanel;
  private found: Record<ClueId, boolean> = {
    bread1: false,
    bread2: false,
    boot: false,
    rag: false,
  };
  private hotspotRects: Phaser.GameObjects.Rectangle[] = [];
  private huntStarted = false;

  constructor() {
    super({ key: 'ShopScene2' });
  }

  preload(): void {
    if (!this.textures.exists('shop_scene2_bg')) {
      this.load.image('shop_scene2_bg', '/assets/scenes/level01/scene2lvl1new.jpg');
    }
  }

  create(): void {
    this.huntStarted = false;
    this.found = { bread1: false, bread2: false, boot: false, rag: false };
    this.hotspotRects = [];

    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('shop_scene2_bg')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузилась сцена внутри лавки', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'shop_scene2_bg');
    const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(sc).setDepth(0);
    enableDebugPositionPicker(this, bg);
    enableDebugHintPicker(this, bg);

    this.cornerBox = new CornerNarrationBox(this);
    this.findPanel = new BottomFindPanel(this);

    this.events.once('shutdown', () => {
      this.cornerBox?.destroy();
      this.cornerBox = undefined;
      this.findPanel?.destroy();
      this.findPanel = undefined;
      this.clearHotspots();
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.cameras.main.once('camerafadeincomplete', () => {
      this.cornerBox?.show(SHOP_SCENE2_LINES, () => {
        this.findPanel?.show({ items: buildFindItems(this.found) });
        this.startHunt(bg);
      });
    });
  }

  private clearHotspots(): void {
    for (const r of this.hotspotRects) {
      r.destroy();
    }
    this.hotspotRects = [];
  }

  private startHunt(bg: Phaser.GameObjects.Image): void {
    if (this.huntStarted) return;
    this.huntStarted = true;

    for (const h of SHOP2_HOTSPOTS) {
      const { x, y, sc } = texFracToScreen(bg, h.u, h.v);
      const w = h.du * 2 * bg.width * sc;
      const hh = h.dv * 2 * bg.height * sc;

      const rect = this.add
        .rectangle(x, y, w, hh, 0xffffff, 0)
        .setDepth(18)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.onClueFound(h.clueId, rect, bg, pointer.worldX, pointer.worldY);
        });

      this.hotspotRects.push(rect);
    }
  }

  private onClueFound(
    id: ClueId,
    rect: Phaser.GameObjects.Rectangle,
    bg: Phaser.GameObjects.Image,
    worldX: number,
    worldY: number,
  ): void {
    if (this.found[id]) return;
    this.playFindFeedback(worldX, worldY);
    this.found[id] = true;
    rect.disableInteractive();
    this.findPanel?.show({ items: buildFindItems(this.found) }, { skipFade: true });

    if (this.allFound()) {
      this.clearHotspots();
      this.cornerBox?.show(SHOP_SCENE2_BEFORE_DOOR_LINES, () => {
        this.showDoorArrow(bg);
      });
    }
  }

  /** Обратная связь только у точки клика: кольца + «✓» (без вспышки всего экрана). */
  private playFindFeedback(worldX: number, worldY: number): void {
    const ring = this.add
      .circle(worldX, worldY, 18, 0xffd878, 0.55)
      .setStrokeStyle(3, 0xfff2c4, 0.95)
      .setDepth(44);
    this.tweens.add({
      targets: ring,
      scale: 3.2,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    const ring2 = this.add.circle(worldX, worldY, 10, 0xffffff, 0.35).setDepth(43);
    this.tweens.add({
      targets: ring2,
      scale: 4,
      alpha: 0,
      duration: 380,
      delay: 40,
      ease: 'Quad.easeOut',
      onComplete: () => ring2.destroy(),
    });

    const chk = this.add
      .text(worldX, worldY - 6, '✓', {
        fontFamily: FONT,
        fontSize: '44px',
        color: '#b8e8a0',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(45)
      .setScale(0.2)
      .setAlpha(1);

    this.tweens.add({
      targets: chk,
      scale: 1.05,
      duration: 200,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: chk,
      y: worldY - 52,
      alpha: 0,
      duration: 520,
      delay: 260,
      ease: 'Sine.easeIn',
      onComplete: () => chk.destroy(),
    });
  }

  private allFound(): boolean {
    return this.found.bread1 && this.found.bread2 && this.found.boot && this.found.rag;
  }

  private showDoorArrow(bg: Phaser.GameObjects.Image): void {
    const { x: ax, y: ay } = texFracToScreen(bg, DOOR_ARROW_U, DOOR_ARROW_V);

    const arrow = this.add
      .text(ax, ay, '▼', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);

    const glow = this.add.graphics().setDepth(48).setAlpha(0.25);
    glow.fillStyle(0xc4a35a, 0.12);
    glow.fillCircle(ax, ay, 26);

    this.tweens.add({ targets: arrow, alpha: 1, duration: 350 });
    this.tweens.add({
      targets: arrow,
      y: ay + 7,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 150,
    });
    this.tweens.add({
      targets: glow,
      alpha: 0.35,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 150,
    });

    this.add
      .rectangle(ax, ay, DOOR_HIT_W, DOOR_HIT_H, 0xffffff, 0)
      .setDepth(52)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => {
        this.cameras.main.fadeOut(900, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ShopScene3');
        });
      });
  }
}
