/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** С какой сцены запускать игру в dev (если нет `?scene=` / `?start=`). */
  readonly VITE_DEV_START_SCENE?: string;
}
