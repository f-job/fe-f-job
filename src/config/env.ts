/**
 * Centralized runtime configuration derived from Vite env variables.
 *
 * `VITE_API_URL` is the absolute origin of the backend (e.g.
 * `https://be-f-job.onrender.com`). When it is empty (local dev) we fall back
 * to relative paths so the Vite dev proxy in `vite.config.ts` handles routing.
 */

// Strip any trailing slash so we can safely concatenate paths.
const rawApiUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

/** Backend origin without trailing slash. Empty string in local dev. */
export const API_ORIGIN = rawApiUrl;

/** Base URL for REST calls (NestJS global prefix is `/api`). */
export const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Origin used by the Socket.io client. When empty, socket.io connects to the
 * current page origin (proxied in dev). In production it points at the backend.
 */
export const SOCKET_ORIGIN = API_ORIGIN;
