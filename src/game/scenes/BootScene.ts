import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.load.image('street_bg', 'assets/scenes/arrival_street_concept.png');
    this.load.image(
      'arrival_walk_bg',
      'assets/scenes/nano_banana_2_make_the_image_slightly_sharper_and_preserve_crisp.jpg',
    );
    this.load.image(
      'meet_bg',
      'assets/scenes/nano_banana_2_keep_the_main_detective_exactly_where_he_is_on_the.jpg',
    );
  }

  create(): void {
    this.scene.start('IntroScene');
  }
}
