import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { NewListingInput } from '$lib/api/schemas';
import { parseBRL } from '$lib/utils/format';
import { api } from '$lib/server/api';
import { guard, parseForm } from '$lib/server/forms';
import type { Actions } from './$types';

const PublishForm = z
	.object({
		title: z.string(),
		description: z.string().optional(),
		category: z.string(),
		condition: z.string(),
		price: z.string().transform((v, ctx) => {
			const cents = parseBRL(v);
			if (cents === null) {
				ctx.addIssue({ code: 'custom', message: 'Digite um preço válido' });
				return z.NEVER;
			}
			return cents;
		}),
		photoCount: z.coerce.number()
	})
	.pipe(NewListingInput);

export const actions: Actions = {
	publish: async ({ request }) => {
		const parsed = parseForm(PublishForm, await request.formData());
		if (!parsed.ok) return parsed.failure;
		const id = await guard(() => api.createListing(parsed.data));
		if (typeof id !== 'string') return id;
		redirect(303, `/anuncio/${id}`);
	}
};
