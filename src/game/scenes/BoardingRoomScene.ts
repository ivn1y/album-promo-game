import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { TextBox } from '../ui/TextBox';
import { levelState } from '../state/LevelState';

export class BoardingRoomScene extends Phaser.Scene {
  private textBox!: TextBox;

  constructor() {
    super({ key: 'BoardingRoomScene' });
  }

  create(): void {
    levelState.enteredBoardingRoom = true;

    this.cameras.main.setBackgroundColor('#121218');
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.drawRoomBackground();
    this.textBox = new TextBox(this);
    this.createRoomHotspots();

    this.add
      .text(GAME_WIDTH / 2, 30, 'Дешёвая комната', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#444444',
      })
      .setOrigin(0.5);
  }

  private drawRoomBackground(): void {
    // пол
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH, 200, 0x1e1e1e);
    // стена
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, GAME_WIDTH, GAME_HEIGHT - 200, 0x1a1a22);
    // лунный свет из окна
    this.add.rectangle(820, 240, 100, 60, 0x222244, 0.4);
  }

  private createRoomHotspots(): void {
    this.createHotspot('Кровать', 500, 420, 120, 60, 0x3a3030, () => this.handleBedClick());
    this.createHotspot('Окно', 820, 240, 80, 50, 0x2a2a44, () => {
      this.textBox.showSingle('Холодный лунный свет. Город за окном не спит.');
    });
    this.createHotspot('Свеча', 350, 330, 20, 40, 0xc4a35a, () => {
      this.textBox.showSingle('Маленький огонёк. Единственный свет в комнате.');
    });
  }

  private createHotspot(
    labelText: string,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    onClick: () => void,
  ): void {
    const rect = this.add
      .rectangle(x, y, w, h, color, 0.7)
      .setStrokeStyle(1, 0x444444)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(x, y - h / 2 - 14, labelText, {
        fontFamily: 'serif',
        fontSize: '12px',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    rect.on('pointerover', () => label.setAlpha(1));
    rect.on('pointerout', () => label.setAlpha(0));
    rect.on('pointerdown', () => {
      if (!this.textBox.isActive()) onClick();
    });
  }

  private handleBedClick(): void {
    levelState.canSleep = true;

    this.textBox.show(
      [{ speaker: 'Герой', text: 'На одну ночь этого достаточно.' }],
      () => this.transitionToDream(),
    );
  }

  private transitionToDream(): void {
    levelState.dreamStarted = true;

    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('DreamScene');
    });
  }
}
