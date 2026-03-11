import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { TextBox } from '../ui/TextBox';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { levelState } from '../state/LevelState';
import { streetHotspots, type HotspotDef } from '../data/level01/hotspots';
import {
  introDialogue,
  playerChoices,
  choiceResponses,
  askForHelpDialogue,
  chestLockedLine,
  chestWithToolLine,
  toolPickupLine,
  rewardDialogue,
} from '../data/level01/dialogues';

export class ArrivalStreetScene extends Phaser.Scene {
  private textBox!: TextBox;
  private choiceMenu!: ChoiceMenu;
  private hotspotObjects = new Map<string, Phaser.GameObjects.Container>();

  constructor() {
    super({ key: 'ArrivalStreetScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a12');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'street_bg')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.createHotspots();

    this.textBox = new TextBox(this);
    this.choiceMenu = new ChoiceMenu(this);
  }

  /* ───────── Хотспоты ───────── */

  private createHotspots(): void {
    for (const def of streetHotspots) {
      const hotspot = this.createSingleHotspot(def);
      this.hotspotObjects.set(def.key, hotspot);
    }
  }

  private createSingleHotspot(def: HotspotDef): Phaser.GameObjects.Container {
    const zone = this.add
      .rectangle(0, 0, def.width, def.height, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    const outline = this.add
      .rectangle(0, 0, def.width, def.height)
      .setFillStyle(0x000000, 0)
      .setStrokeStyle(1.5, 0xc4a35a, 0)
      .setAlpha(0);

    const hasLabel = def.label.length > 0;
    const label = this.add
      .text(0, -def.height / 2 - 18, def.label, {
        fontFamily: 'serif',
        fontSize: '12px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const container = this.add.container(def.x, def.y, [zone, outline, label]);

    zone.on('pointerover', () => {
      outline.setAlpha(0.7);
      if (hasLabel) label.setAlpha(1);
    });
    zone.on('pointerout', () => {
      outline.setAlpha(0);
      label.setAlpha(0);
    });
    zone.on('pointerdown', () => this.onHotspotClick(def.key));

    return container;
  }

  private onHotspotClick(key: string): void {
    if (this.textBox.isActive()) return;

    switch (key) {
      case 'girl':
        this.handleGirlClick();
        break;
      case 'chest':
        this.handleChestClick();
        break;
      case 'tool':
        this.handleToolClick();
        break;
      default:
        this.handleGenericInspect(key);
        break;
    }
  }

  /* ───────── Девушка ───────── */

  private handleGirlClick(): void {
    if (!levelState.hasTalkedToGirl) {
      this.startIntroDialogue();
    } else if (!levelState.chestOpened) {
      this.textBox.showSingle('Нужно помочь ей с сундуком.');
    } else if (!levelState.receivedMoney) {
      this.startRewardDialogue();
    } else {
      this.textBox.showSingle('Она уже помогла мне.');
    }
  }

  private startIntroDialogue(): void {
    this.textBox.show(introDialogue, () => {
      levelState.hasTalkedToGirl = true;
      this.showPlayerChoice();
    });
  }

  private showPlayerChoice(): void {
    this.choiceMenu.show(playerChoices, (id) => {
      levelState.hasChosenReply = true;
      levelState.selectedReplyTone = id as 1 | 2 | 3;

      const response = choiceResponses[id];
      this.textBox.show(response, () => {
        this.textBox.show(askForHelpDialogue);
      });
    });
  }

  /* ───────── Сундук ───────── */

  private handleChestClick(): void {
    if (!levelState.hasTalkedToGirl) {
      this.textBox.showSingle('Чей-то сундук. Лучше сначала осмотреться.');
      return;
    }
    if (levelState.chestOpened) {
      this.textBox.showSingle('Сундук уже открыт.');
      return;
    }
    if (!levelState.hasFoundTool) {
      this.textBox.showSingle(chestLockedLine.text);
      return;
    }

    this.textBox.showSingle(chestWithToolLine.text, () => {
      this.startLockpick();
    });
  }

  private startLockpick(): void {
    levelState.lockpickStarted = true;

    const overlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(90);

    this.tweens.add({ targets: overlay, fillAlpha: 0.65, duration: 400 });

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const BAR_W = 360;
    const BAR_H = 24;
    const SWEET_W = 54;

    const title = this.add
      .text(cx, cy - 50, 'Вскрытие замка', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#c4a35a',
      })
      .setOrigin(0.5)
      .setDepth(91)
      .setAlpha(0);

    const barBg = this.add
      .rectangle(cx, cy, BAR_W, BAR_H, 0x1a1a24)
      .setStrokeStyle(1, 0x3a3a4a)
      .setDepth(91)
      .setAlpha(0);

    const sweetSpot = this.add
      .rectangle(cx + 70, cy, SWEET_W, BAR_H - 4, 0x2a4a2a, 0.6)
      .setDepth(91)
      .setAlpha(0);

    const marker = this.add
      .rectangle(cx - BAR_W / 2 + 4, cy, 6, BAR_H - 6, 0xc4a35a)
      .setDepth(92)
      .setAlpha(0);

    const hint = this.add
      .text(cx, cy + 34, 'нажмите в подсвеченной зоне', {
        fontFamily: 'serif',
        fontSize: '12px',
        color: '#555566',
      })
      .setOrigin(0.5)
      .setDepth(91)
      .setAlpha(0);

    const elements = [title, barBg, sweetSpot, marker, hint];
    elements.forEach((el) => {
      this.tweens.add({ targets: el, alpha: 1, duration: 400, delay: 200 });
    });

    this.tweens.add({
      targets: marker,
      x: cx + BAR_W / 2 - 4,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      delay: 600,
      ease: 'Sine.easeInOut',
    });

    const lockpickZone = this.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(93)
      .setInteractive();

    const cleanup = () => {
      this.tweens.killTweensOf(marker);
      [overlay, title, barBg, sweetSpot, marker, hint, lockpickZone].forEach((el) => {
        this.tweens.add({
          targets: el,
          alpha: 0,
          duration: 250,
          onComplete: () => el.destroy(),
        });
      });
    };

    lockpickZone.on('pointerdown', () => {
      const halfSweet = SWEET_W / 2;
      const inZone =
        marker.x >= sweetSpot.x - halfSweet && marker.x <= sweetSpot.x + halfSweet;

      if (inZone) {
        cleanup();
        this.time.delayedCall(300, () => this.onLockpickSuccess());
      } else {
        this.cameras.main.shake(120, 0.004);
        marker.setFillStyle(0x993333);
        this.time.delayedCall(250, () => marker.setFillStyle(0xc4a35a));
      }
    });
  }

  private onLockpickSuccess(): void {
    levelState.chestOpened = true;

    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xc4a35a, 0.08)
      .setDepth(89);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    });

    this.textBox.showSingle('Замок поддался.', () => {
      this.startRewardDialogue();
    });
  }

  /* ───────── Шпилька ───────── */

  private handleToolClick(): void {
    if (levelState.hasFoundTool) {
      this.textBox.showSingle('Здесь больше ничего нет.');
      return;
    }

    levelState.hasFoundTool = true;

    const toolContainer = this.hotspotObjects.get('tool');
    if (toolContainer) {
      this.tweens.add({
        targets: toolContainer,
        alpha: 0,
        duration: 300,
      });
    }

    this.textBox.showSingle(toolPickupLine.text);
  }

  /* ───────── Награда и переход ───────── */

  private startRewardDialogue(): void {
    this.textBox.show(rewardDialogue, () => {
      levelState.receivedMoney = true;
      this.transitionToRoom();
    });
  }

  private transitionToRoom(): void {
    this.cameras.main.fadeOut(1000, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      const card = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Герой уходит искать ночлег...', {
          fontFamily: 'serif',
          fontSize: '18px',
          color: '#666677',
        })
        .setOrigin(0.5)
        .setDepth(200);

      this.cameras.main.fadeIn(800, 0, 0, 0);

      this.time.delayedCall(2200, () => {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('BoardingRoomScene');
        });
      });
    });
  }

  /* ───────── Осмотр ───────── */

  private handleGenericInspect(key: string): void {
    const def = streetHotspots.find((h) => h.key === key);
    if (def?.inspectText) {
      this.textBox.showSingle(def.inspectText);
    }
  }
}
