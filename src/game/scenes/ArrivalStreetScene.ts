import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class ArrivalStreetScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ArrivalStreetScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Улица прибытия', {
        fontFamily: 'serif',
        fontSize: '36px',
        color: '#c4a35a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Сцена 1 — Level 01', {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#888888',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ нажмите, чтобы продолжить ]', {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#555555',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BoardingRoomScene');
      });
    });
  }
}
