import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { Id } from '$lib/api/schemas';
import { parseBRL } from '$lib/utils/format';
import { api } from '$lib/server/api';
import { guard, parseForm, requireId } from '$lib/server/forms';
import { safeBack } from '$lib/server/prefs';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const detail = await api.listing(requireId(params.id));
	if (!detail) error(404, 'Anúncio não encontrado');
	return { detail };
};

const CommentForm = z.object({
	text: z.string().trim().min(1, 'Escreva um comentário').max(500, 'Comentário muito longo'),
	replyTo: Id.optional().or(z.literal('').transform(() => undefined))
});

const OfferForm = z.object({
	amount: z.string().transform((v, ctx) => {
		const cents = parseBRL(v);
		if (cents === null || cents <= 0) {
			ctx.addIssue({ code: 'custom', message: 'Digite um valor válido' });
			return z.NEVER;
		}
		return cents;
	})
});

const BuyForm = z.object({ delivery: z.enum(['entrega', 'retirar']) });

export const actions: Actions = {
	favorite: async ({ params, request }) => {
		const form = await request.formData();
		const id = requireId(params.id);
		const result = await guard(() => api.toggleFavorite(id));
		if (typeof result !== 'boolean') return result;
		if (form.has('back')) redirect(303, safeBack(form.get('back')));
		return { favorite: result };
	},

	comment: async ({ params, request }) => {
		const form = await request.formData();
		const parsed = parseForm(CommentForm, form);
		if (!parsed.ok) return parsed.failure;
		const id = requireId(params.id);
		const result = await guard(() => api.addComment(id, parsed.data.text, parsed.data.replyTo));
		if (result) return result;
		if (form.has('back')) redirect(303, safeBack(form.get('back')));
		return { commented: true };
	},

	offer: async ({ params, request }) => {
		const parsed = parseForm(OfferForm, await request.formData());
		if (!parsed.ok) return parsed.failure;
		const id = requireId(params.id);
		const conversationId = await guard(() => api.makeOffer(id, parsed.data.amount));
		if (typeof conversationId !== 'string') return conversationId;
		redirect(303, `/mensagens/${conversationId}`);
	},

	buy: async ({ params, request }) => {
		const parsed = parseForm(BuyForm, await request.formData());
		if (!parsed.ok) return parsed.failure;
		const id = requireId(params.id);
		const result = await guard(() => api.addToCart(id, parsed.data.delivery));
		if (result) return result;
		redirect(303, '/sacola');
	}
};
