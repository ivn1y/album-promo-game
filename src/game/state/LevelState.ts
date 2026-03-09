export type Level01State = {
  hasTalkedToGirl: boolean;
  hasChosenReply: boolean;
  selectedReplyTone: 1 | 2 | 3 | null;
  hasFoundTool: boolean;
  lockpickStarted: boolean;
  chestOpened: boolean;
  receivedMoney: boolean;
  enteredBoardingRoom: boolean;
  canSleep: boolean;
  dreamStarted: boolean;
  dreamCompleted: boolean;
};

const createInitialState = (): Level01State => ({
  hasTalkedToGirl: false,
  hasChosenReply: false,
  selectedReplyTone: null,
  hasFoundTool: false,
  lockpickStarted: false,
  chestOpened: false,
  receivedMoney: false,
  enteredBoardingRoom: false,
  canSleep: false,
  dreamStarted: false,
  dreamCompleted: false,
});

export let levelState: Level01State = createInitialState();

export function resetLevelState(): void {
  levelState = createInitialState();
}
