import Phaser from 'phaser';
import { getDevStartSceneKey } from '../devStart';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  /** Без тяжёлых ассетов — сразу пролог; картинки грузят сцены, которым они нужны. */
  preload(): void {}

  create(): void {
    const devScene = getDevStartSceneKey();
    if (devScene) {
      console.info(`[dev] Старт со сцены: ${devScene}`);
      this.scene.start(devScene);
      return;
    }
    this.scene.start('IntroScene');
  }
}
