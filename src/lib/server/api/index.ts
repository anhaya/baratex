/**
 * The single place routes get their data from. Swap `createMockApi()` for the
 * HTTP client when the backend exists; nothing else has to change.
 *
 * This module lives under `$lib/server`, so SvelteKit refuses to bundle it
 * into browser code.
 */
import type { BaratexApi } from '$lib/api/types';
import { createMockApi } from './mock';

export const api: BaratexApi = createMockApi();
