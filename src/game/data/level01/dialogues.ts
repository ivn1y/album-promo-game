export type DialogueLine = {
  speaker: string | null;
  text: string;
};

export const introDialogue: DialogueLine[] = [
  { speaker: 'Девушка', text: 'Вы не местный, верно?' },
  { speaker: 'Герой', text: 'Я прибыл только сегодня.' },
  { speaker: 'Девушка', text: 'Вижу. В этом городе приезжих всегда узнаёшь сразу.' },
  { speaker: 'Герой', text: 'По мне это так видно?' },
  { speaker: 'Девушка', text: 'У местных взгляд другой.' },
  { speaker: 'Девушка', text: 'И зачем же вы пришли сюда?' },
];

export const playerChoices = [
  { id: 1, text: 'Хочу найти здесь своё место.' },
  { id: 2, text: 'Говорят, в этом городе можно стать кем угодно.' },
  { id: 3, text: 'Мне просто больше некуда было идти.' },
];

export const choiceResponses: Record<number, DialogueLine[]> = {
  1: [{ speaker: 'Девушка', text: 'Тогда начните с малого.' }],
  2: [{ speaker: 'Девушка', text: 'Говорят многое.' }],
  3: [{ speaker: 'Девушка', text: '…Тогда тем более не стойте без дела.' }],
};

export const askForHelpDialogue: DialogueLine[] = [
  { speaker: 'Девушка', text: 'Раз уж вы всё равно стоите здесь, не поможете мне с сундуком?' },
  { speaker: 'Герой', text: 'Попробую.' },
];

export const chestLockedLine: DialogueLine = {
  speaker: 'Герой',
  text: 'Заперт.',
};

export const chestWithToolLine: DialogueLine = {
  speaker: 'Герой',
  text: 'Похоже, теперь можно попробовать открыть.',
};

export const toolPickupLine: DialogueLine = {
  speaker: null,
  text: 'Тонкая металлическая шпилька. Может пригодиться.',
};

export const rewardDialogue: DialogueLine[] = [
  { speaker: 'Девушка', text: 'Спасибо. Выручили меня.' },
  { speaker: 'Герой', text: 'Пустяки.' },
  { speaker: 'Девушка', text: 'Вы ведь ещё даже не успели найти ночлег, так?' },
  { speaker: 'Герой', text: '…Не успел.' },
  { speaker: 'Девушка', text: 'Тогда возьмите. На хорошую комнату не хватит, но под крышу вас пустят.' },
];
