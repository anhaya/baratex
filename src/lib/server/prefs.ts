import type { Cookies } from '@sveltejs/kit';

export const RADIUS_COOKIE = 'raio';
export const DEFAULT_RADIUS = 5;
export const MIN_RADIUS = 1;
export const MAX_RADIUS = 50;

/** Reads the radius cookie, falling back to the default on anything unexpected. */
export function readRadius(cookies: Cookies): number | null {
	const raw = cookies.get(RADIUS_COOKIE);
	if (raw === 'entrega') return null;
	const km = Number(raw);
	if (!Number.isInteger(km) || km < MIN_RADIUS || km > MAX_RADIUS) return DEFAULT_RADIUS;
	return km;
}

export function writeRadius(cookies: Cookies, km: number | null): void {
	cookies.set(RADIUS_COOKIE, km === null ? 'entrega' : String(km), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 365
	});
}

/**
 * Accepts only same-origin relative paths for post-action redirects, so a
 * crafted form cannot bounce people to another site.
 */
export function safeBack(value: FormDataEntryValue | null, fallback = '/'): string {
	if (typeof value !== 'string') return fallback;
	if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
	if (value.length > 300 || /[\r\n]/.test(value)) return fallback;
	return value;
}
