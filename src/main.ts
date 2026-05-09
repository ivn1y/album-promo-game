import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { initForceLandscape } from './forceLandscape';

initForceLandscape();

new Phaser.Game(gameConfig);
