/**
 * Только в `vite` dev: старт с середины, без прогона с начала.
 * Пример: `http://localhost:<порт>/?scene=ShopScene2` (порт из `npm run dev`; ключ = имя сцены).
 * Параметр в URL важнее `.env.local` → `VITE_DEV_START_SCENE`. В production игнорируется.
 */
const DEV_STARTABLE_SCENES = [
  'IntroScene',
  'CityDistantScene',
  'BridgeMeetScene',
  'Map1Scene',
  'ShopScene1',
  'ShopScene2',
  'ShopScene3',
] as const;

export type DevStartableScene = (typeof DEV_STARTABLE_SCENES)[number];

function isDevStartable(key: string): key is DevStartableScene {
  return (DEV_STARTABLE_SCENES as readonly string[]).includes(key);
}

export function getDevStartSceneKey(): DevStartableScene | null {
  if (!import.meta.env.DEV) return null;

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const fromUrl = (params.get('scene') ?? params.get('start') ?? '').trim();
  const fromEnv = (import.meta.env.VITE_DEV_START_SCENE as string | undefined)?.trim() ?? '';
  const key = fromUrl || fromEnv;
  if (!key) return null;

  if (!isDevStartable(key)) {
    console.warn(
      `[dev] Неизвестная сцена "${key}". Допустимо: ${DEV_STARTABLE_SCENES.join(', ')}`,
    );
    return null;
  }
  return key;
}
