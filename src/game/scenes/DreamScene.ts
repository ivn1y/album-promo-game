import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class DreamScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DreamScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#08080e');
    this.cameras.main.fadeIn(1500, 0, 0, 0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '...сон...', {
        fontFamily: 'serif',
        fontSize: '36px',
        color: '#4a3a6a',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Ночная мини-игра — заглушка', {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#444444',
      })
      .setOrigin(0.5);

    const ending = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ конец vertical slice ]', {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#333333',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: ending,
      alpha: 0.7,
      delay: 2000,
      duration: 2000,
    });
  }
}
