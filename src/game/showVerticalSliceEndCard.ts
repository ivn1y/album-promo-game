import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

const FONT = '"VT323", "Courier New", monospace';

/** Общая заглушка «конец доступного сюжета». */
export function showVerticalSliceEndCard(scene: Phaser.Scene): void {
  scene.input.removeAllListeners();
  scene.input.keyboard?.removeAllListeners();

  scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 8, GAME_HEIGHT + 8, 0x000000)
    .setDepth(2000);

  scene.add
    .text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Вступительная часть завершена.\nДальнейшие сцены появятся в следующих версиях.',
      {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#7a7568',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: GAME_WIDTH - 120 },
      },
    )
    .setOrigin(0.5)
    .setDepth(2001);
}
