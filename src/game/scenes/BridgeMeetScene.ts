import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { meetOnBridgeUrl } from '../level01Assets';
import { TextBox } from '../ui/TextBox';
import { ChoiceMenu } from '../ui/ChoiceMenu';

const FONT = '"VT323", "Courier New", monospace';

const DIALOGUE_INTRO = [
  { speaker: null, text: 'На мосту вас уже ждали.' },
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

const DIALOGUE_TO_GATE = [
  { speaker: 'Помощник', text: 'Впрочем, слова — это слова. Лучше покажу на деле.' },
  { speaker: 'Помощник', text: 'Сегодня утром обокрали лавку в нижнем квартале. Хозяин в ярости.' },
  { speaker: 'Помощник', text: 'Замок взломан, товар пропал. Никто ничего не видел.' },
  { speaker: 'Помощник', text: 'Это недалеко. Предлагаю начать с этого.' },
  { speaker: null, text: 'Детектив молча кивнул. Первое дело ждало его.' },
];

const ASSISTANT_X = 920;
const ASSISTANT_Y = 360;
const HIT_W = 140;
const HIT_H = 220;
const HINT_BUBBLE_Y = ASSISTANT_Y - 152;

/** Стрелка на воротах (правый проём на арте) — подвинь под свой кадр. */
const GATE_ARROW_X = 1020;
const GATE_ARROW_Y = 258;
const GATE_HIT_W = 110;
const GATE_HIT_H = 140;

export class BridgeMeetScene extends Phaser.Scene {
  private textBox!: TextBox;
  private choiceMenu!: ChoiceMenu;
  private hintBubble!: Phaser.GameObjects.Container;
  private assistantHit!: Phaser.GameObjects.Rectangle;
  private canClickAssistant = true;
  private dialoguePlayed = false;

  constructor() {
    super({ key: 'BridgeMeetScene' });
  }

  preload(): void {
    if (!this.textures.exists('bridge_meet_bg')) {
      this.load.image('bridge_meet_bg', meetOnBridgeUrl);
    }
  }

  create(): void {
    this.canClickAssistant = true;
    this.dialoguePlayed = false;
    this.cameras.main.setBackgroundColor(0x000000);

    if (!this.textures.exists('bridge_meet_bg')) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Не загрузился meetuppic.jpg', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#888888',
        })
        .setOrigin(0.5);
      return;
    }

    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bridge_meet_bg');
    const sc = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
    bg.setScale(sc).setDepth(0);

    this.textBox = new TextBox(this);
    this.choiceMenu = new ChoiceMenu(this);

    this.cameras.main.fadeIn(900, 0, 0, 0);
    this.time.delayedCall(900, () => this.showQuestionOverAssistant());
  }

  /** 1) Сначала только «?» и зона клика у ассистента. */
  private showQuestionOverAssistant(): void {
    const hitTop = HINT_BUBBLE_Y - 35;
    const hitBottom = ASSISTANT_Y + HIT_H * 0.55;
    const hitCy = (hitTop + hitBottom) / 2;
    const hitH = hitBottom - hitTop;

    this.assistantHit = this.add
      .rectangle(ASSISTANT_X, hitCy, HIT_W, hitH, 0xffffff, 0)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.onAssistantFirstClick());

    this.hintBubble = this.createHintBubble(ASSISTANT_X, HINT_BUBBLE_Y);
    this.hintBubble.setAlpha(0);
    this.tweens.add({
      targets: this.hintBubble,
      alpha: 1,
      duration: 450,
      ease: 'Sine.easeOut',
    });
  }

  /** 2) Клик — весь диалог подряд. */
  private onAssistantFirstClick(): void {
    if (!this.canClickAssistant || this.dialoguePlayed) return;
    if (this.textBox.isActive()) return;

    this.dialoguePlayed = true;
    this.canClickAssistant = false;
    this.assistantHit.disableInteractive();

    this.tweens.add({
      targets: this.hintBubble,
      alpha: 0,
      duration: 250,
    });

    this.textBox.show(DIALOGUE_INTRO, () => {
      this.choiceMenu.show(PLAYER_CHOICES, (id) => {
        const response = CHOICE_RESPONSES[id];
        this.textBox.show(response, () => {
          this.textBox.show(DIALOGUE_TO_GATE, () => {
            this.showGateArrowCue();
          });
        });
      });
    });
  }

  private createHintBubble(x: number, y: number): Phaser.GameObjects.Container {
    const bubble = this.add
      .text(x, y, '?', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(4);

    const glow = this.add.graphics().setDepth(3).setAlpha(0.3);
    glow.fillStyle(0xc4a35a, 0.15);
    glow.fillCircle(x, y, 22);

    this.tweens.add({
      targets: bubble,
      y: y - 6,
      alpha: 0.55,
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

  /** 3) Стрелка на воротах — клик туда, дальше в город. */
  private showGateArrowCue(): void {
    const ax = GATE_ARROW_X;
    const ay = GATE_ARROW_Y;

    const arrow = this.add
      .text(ax, ay, '▼', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#c4a35a',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    const glow = this.add.graphics().setDepth(9).setAlpha(0.25);
    glow.fillStyle(0xc4a35a, 0.12);
    glow.fillCircle(ax, ay, 28);

    const gateLabel = this.add
      .text(ax, ay + 36, 'ворота', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#a89880',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0);

    this.tweens.add({
      targets: [arrow, gateLabel],
      alpha: 1,
      duration: 400,
    });

    this.tweens.add({
      targets: arrow,
      y: ay + 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });

    this.tweens.add({
      targets: glow,
      alpha: 0.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });

    this.add
      .rectangle(ax, ay, GATE_HIT_W, GATE_HIT_H, 0xffffff, 0)
      .setDepth(11)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(1200, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.showOpeningEnd();
        });
      });
  }

  /** После ворот пока нет следующей сцены — затемнение и короткая заставка-заглушка. */
  private showOpeningEnd(): void {
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllListeners();

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 8, GAME_HEIGHT + 8, 0x000000)
      .setDepth(2000);

    this.add
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
}
