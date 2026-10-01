import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { MAX_RADIUS, MIN_RADIUS, safeBack, writeRadius } from '$lib/server/prefs';
import type { RequestHandler } from './$types';

const Radius = z.union([
	z.literal('entrega').transform(() => null),
	z.coerce.number().int().min(MIN_RADIUS).max(MAX_RADIUS)
]);

export const POST: RequestHandler = async ({ request, cookies }) => {
	const form = await request.formData();
	const parsed = Radius.safeParse(form.get('raio'));
	if (!parsed.success) return new Response('Raio inválido', { status: 400 });
	writeRadius(cookies, parsed.data);
	if (request.headers.get('accept')?.includes('application/json')) {
		return Response.json({ radiusKm: parsed.data });
	}
	redirect(303, safeBack(form.get('back')));
};
