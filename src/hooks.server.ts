import { dev } from '$app/environment';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { readRadius } from '$lib/server/prefs';

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-origin'
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.radiusKm = readRadius(event.cookies);

	const response = await resolve(event, {
		// Only ship the fonts the first paint needs.
		preload: ({ type, path }) => type === 'js' || type === 'css' || (type === 'font' && /latin-wght|latin-700/.test(path))
	});

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(name, value);
	}
	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
	}
	// Pages carry per-user data (favorites, cart), so shared caches must not keep them.
	if (response.headers.get('content-type')?.startsWith('text/html')) {
		response.headers.set('Cache-Control', 'private, no-store');
	}
	return response;
};

export const handleError: HandleServerError = ({ error, status }) => {
	const id = crypto.randomUUID();
	if (status !== 404) console.error(id, error);
	// Never leak stack traces or internal messages to the browser.
	return { message: status === 404 ? 'Página não encontrada' : 'Algo deu errado. Tente de novo.', id };
};
