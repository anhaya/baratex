import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { AiRequest, SearchFilter } from '$lib/api/schemas';
import { api } from '$lib/server/api';
import { parseForm } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

const SAMPLE_QUERY =
	'Procuro um carrinho de bebê leve, que feche com uma mão. Até R$ 400, de preferência perto de Pinheiros.';

const AskForm = z.object({
	context: z.string().optional(),
	message: z.string(),
	disabled: z
		.string()
		.optional()
		.transform((v) => (v ? v.split(',').filter(Boolean) : []))
		.pipe(z.array(SearchFilter.shape.key).max(6))
});

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q')?.slice(0, 300).trim() || SAMPLE_QUERY;
	const request = AiRequest.parse({ message: q });
	const [first, savedSearches] = await Promise.all([api.aiSearch(request, locals.radiusKm), api.savedSearches()]);
	return { first: { request, ...first }, savedSearches };
};

export const actions: Actions = {
	ask: async ({ request, locals }) => {
		const parsed = parseForm(AskForm, await request.formData());
		if (!parsed.ok) return parsed.failure;
		const req = AiRequest.safeParse(parsed.data);
		if (!req.success) return fail(400, { message: req.error.issues[0]?.message ?? 'Pergunta inválida' });
		const turn = await api.aiSearch(req.data, locals.radiusKm);
		return { turn: { request: req.data, ...turn } };
	},

	alert: async ({ request }) => {
		const parsed = parseForm(z.object({ label: z.string().trim().min(1).max(80) }), await request.formData());
		if (!parsed.ok) return parsed.failure;
		await api.saveSearch(parsed.data.label);
		return { saved: parsed.data.label };
	}
};
