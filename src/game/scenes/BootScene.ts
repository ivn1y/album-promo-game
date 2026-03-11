import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('street_bg', 'assets/scenes/arrival_street_concept.png');
  }

  create(): void {
    this.scene.start('ArrivalStreetScene');
  }
}
