import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { TextBox } from '../ui/TextBox';
import { ChoiceMenu } from '../ui/ChoiceMenu';

const DIALOGUE_INTRO = [
  { speaker: null, text: 'У ворот стоял человек. Он явно кого-то ждал.' },
  { speaker: 'Помощник', text: 'Вы, должно быть, тот самый детектив.' },
  { speaker: 'Помощник', text: 'Меня зовут Эдвин. Мне поручили встретить вас и помочь освоиться.' },
  { speaker: 'Помощник', text: 'Город давно ждал кого-то, кто наведёт здесь порядок.' },
];

const PLAYER_CHOICES = [
  { id: 1, text: 'Расскажи, что здесь происходит.' },
  { id: 2, text: 'Мне не нужна помощь.' },
  { id: 3, text: 'Давно ждали? Насколько всё плохо?' },
];

const CHOICE_RESPONSES: Record<number, { speaker: string | null; text: string }[]> = {
  1: [
    { speaker: 'Помощник', text: 'Кражи, взломы, ограбления... Обычные вещи, но их никто не расследовал.' },
    { speaker: 'Помощник', text: 'Люди привыкли. Но от вас ждут, что это изменится.' },
  ],
  2: [
    { speaker: null, text: 'Эдвин слегка замялся, но быстро взял себя в руки.' },
    { speaker: 'Помощник', text: 'Понимаю. Но мне всё же велено быть рядом, если что-то понадобится.' },
  ],
  3: [
    { speaker: 'Помощник', text: 'Достаточно плохо. Последний следователь уехал лет десять назад.' },
    { speaker: 'Помощник', text: 'С тех пор горожане справлялись сами. Или не справлялись.' },
  ],
};

const DIALOGUE_AFTER = [
  { speaker: 'Помощник', text: 'Впрочем, слова — это слова. Лучше покажу на деле.' },
  { speaker: 'Помощник', text: 'Сегодня утром обокрали лавку в нижнем квартале. Хозяин в ярости.' },
  { speaker: 'Помощник', text: 'Замок взломан, товар пропал. Никто ничего не видел.' },
  { speaker: 'Помощник', text: 'Это недалеко. Предлагаю начать с этого.' },
  { speaker: null, text: 'Детектив молча кивнул. Первое дело ждало его.' },
];

const ASSISTANT_X = 912;
const ASSISTANT_Y = 310;
const HIT_W = 80;
const HIT_H = 130;

export class MeetAssistantScene extends Phaser.Scene {
  private textBox!: TextBox;
  private choiceMenu!: ChoiceMenu;
  private hintBubble!: Phaser.GameObjects.Container;
  private dialogueStarted = false;

  constructor() {
    super({ key: 'MeetAssistantScene' });
  }

  create(): void {
    this.dialogueStarted = false;
    this.cameras.main.setBackgroundColor(0x0a0a0a);

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'meet_bg');
    const s = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(s);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080810, 0.3)
      .setDepth(1);

    this.createAssistantHitZone();
    this.hintBubble = this.createHintBubble(ASSISTANT_X, ASSISTANT_Y - 85);

    this.textBox = new TextBox(this);
    this.choiceMenu = new ChoiceMenu(this);

    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  private createAssistantHitZone(): void {
    const hitZone = this.add
      .rectangle(ASSISTANT_X, ASSISTANT_Y, HIT_W, HIT_H, 0xffffff, 0)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => this.onAssistantClick());
  }

  private createHintBubble(x: number, y: number): Phaser.GameObjects.Container {
    const bubble = this.add
      .text(x, y, '?', {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(4);

    const glow = this.add.graphics().setDepth(3).setAlpha(0.3);
    glow.fillStyle(0xc4a35a, 0.15);
    glow.fillCircle(x, y, 20);

    this.tweens.add({
      targets: bubble,
      y: y - 6,
      alpha: 0.5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return this.add.container(0, 0, [glow, bubble]);
  }

  private onAssistantClick(): void {
    if (this.dialogueStarted) return;
    if (this.textBox.isActive()) return;
    this.dialogueStarted = true;

    this.tweens.add({
      targets: this.hintBubble,
      alpha: 0,
      duration: 300,
    });

    this.textBox.show(DIALOGUE_INTRO, () => {
      this.showPlayerChoice();
    });
  }

  private showPlayerChoice(): void {
    this.choiceMenu.show(PLAYER_CHOICES, (id) => {
      const response = CHOICE_RESPONSES[id];
      this.textBox.show(response, () => {
        this.textBox.show(DIALOGUE_AFTER, () => {
          this.showGateArrow();
        });
      });
    });
  }

  private showGateArrow(): void {
    const arrowX = 1000;
    const arrowY = 245;

    const arrow = this.add
      .text(arrowX, arrowY, '▼', {
        fontFamily: 'serif',
        fontSize: '30px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(1);

    const glow = this.add.graphics().setDepth(9).setAlpha(0.3);
    glow.fillStyle(0xc4a35a, 0.1);
    glow.fillCircle(arrowX, arrowY, 26);

    this.tweens.add({
      targets: arrow,
      y: arrowY + 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: glow,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const hitZone = this.add
      .rectangle(arrowX, arrowY, 70, 70, 0xffffff, 0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('InvestigationScene');
      });
    });
  }
}
