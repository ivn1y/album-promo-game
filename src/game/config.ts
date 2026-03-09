import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { ArrivalStreetScene } from './scenes/ArrivalStreetScene';
import { BoardingRoomScene } from './scenes/BoardingRoomScene';
import { DreamScene } from './scenes/DreamScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, ArrivalStreetScene, BoardingRoomScene, DreamScene],
};
