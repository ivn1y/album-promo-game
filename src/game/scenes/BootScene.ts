import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // placeholder: здесь будет предзагрузка ассетов
  }

  create(): void {
    this.scene.start('ArrivalStreetScene');
  }
}
