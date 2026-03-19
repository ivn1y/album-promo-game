import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export type Choice = {
  id: number;
  text: string;
};

const ITEM_HEIGHT = 50;
const ITEM_GAP = 8;
const MENU_WIDTH = 640;

export class ChoiceMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(110);
    this.container.setVisible(false);
  }

  show(choices: Choice[], onSelect: (id: number) => void): void {
    this.container.removeAll(true);

    const totalHeight = choices.length * ITEM_HEIGHT + (choices.length - 1) * ITEM_GAP;
    const bottomMargin = 24;
    const startY = GAME_HEIGHT - bottomMargin - totalHeight;

    const overlay = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05050a, 0.4);
    this.container.add(overlay);

    choices.forEach((choice, i) => {
      const y = startY + i * (ITEM_HEIGHT + ITEM_GAP);
      const cy = y + ITEM_HEIGHT / 2;

      const bg = this.scene.add
        .rectangle(GAME_WIDTH / 2, cy, MENU_WIDTH, ITEM_HEIGHT, 0x12121e, 0.92)
        .setStrokeStyle(1, 0x3a3a4a)
        .setInteractive({ useHandCursor: true });

      const label = this.scene.add
        .text(GAME_WIDTH / 2, cy, `«${choice.text}»`, {
          fontFamily: 'serif',
          fontSize: '19px',
          color: '#b0b0b0',
        })
        .setOrigin(0.5);

      bg.on('pointerover', () => {
        bg.setStrokeStyle(1, 0xc4a35a);
        label.setColor('#e8e0cc');
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(1, 0x3a3a4a);
        label.setColor('#b0b0b0');
      });
      bg.on('pointerdown', () => {
        this.hide();
        onSelect(choice.id);
      });

      this.container.add([bg, label]);
    });

    this.container.setAlpha(0);
    this.container.setVisible(true);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 250,
    });
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.container.setVisible(false);
        this.container.removeAll(true);
      },
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
