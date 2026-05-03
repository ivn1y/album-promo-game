import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  /** Без тяжёлых ассетов — сразу пролог; картинки грузят сцены, которым они нужны. */
  preload(): void {}

  create(): void {
    this.scene.start('IntroScene');
  }
}
