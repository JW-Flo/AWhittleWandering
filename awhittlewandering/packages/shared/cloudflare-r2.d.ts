/**
 * Patch file to avoid duplicate identifier errors between our local
 * `packages/shared/types.ts` and `@cloudflare/workers-types` which both
 * declare `R2Objects` and related field names. We intentionally provide an
 * empty interface so the compiler treats the name as merged instead of
 * duplicated.
 *
 * This file is referenced automatically by TypeScript because it lives
 * inside `packages/shared` which is included via the root `tsconfig.json`.
 * No runtime JS will be emitted.
 */

/* eslint-disable @typescript-eslint/no-empty-interface */
interface R2Objects {}
