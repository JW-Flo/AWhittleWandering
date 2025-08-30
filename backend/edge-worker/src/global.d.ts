import type { Env as WorkerEnv } from './types/env';

declare global {
  interface Env extends WorkerEnv {}
}