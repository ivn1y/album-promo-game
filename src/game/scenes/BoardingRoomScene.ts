import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class BoardingRoomScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BoardingRoomScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#121218');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Дешёвая комната', {
        fontFamily: 'serif',
        fontSize: '36px',
        color: '#8a7a5a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Сцена 2 — Level 01', {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#666666',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ нажмите на кровать, чтобы уснуть ]', {
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
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('DreamScene');
      });
    });
  }
}
