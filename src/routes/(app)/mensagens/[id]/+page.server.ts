import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { Id } from '$lib/api/schemas';
import { parseBRL } from '$lib/utils/format';
import { api } from '$lib/server/api';
import { guard, parseForm, requireId } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, depends }) => {
	depends('app:conversation');
	const detail = await api.conversation(requireId(params.id));
	if (!detail) error(404, 'Conversa não encontrada');
	return { detail };
};

const Send = z.object({ text: z.string().trim().min(1, 'Escreva uma mensagem').max(1000, 'Mensagem muito longa') });
const Respond = z.object({ messageId: Id });
const Counter = Respond.extend({
	amount: z.string().transform((v, ctx) => {
		const cents = parseBRL(v);
		if (cents === null || cents <= 0) {
			ctx.addIssue({ code: 'custom', message: 'Digite um valor válido' });
			return z.NEVER;
		}
		return cents;
	})
});

export const actions: Actions = {
	send: async ({ params, request }) => {
		const parsed = parseForm(Send, await request.formData());
		if (!parsed.ok) return parsed.failure;
		return (await guard(() => api.sendMessage(requireId(params.id), parsed.data.text))) ?? { sent: true };
	},
	accept: async ({ params, request }) => {
		const parsed = parseForm(Respond, await request.formData());
		if (!parsed.ok) return parsed.failure;
		return (await guard(() => api.respondToOffer(requireId(params.id), parsed.data.messageId, { kind: 'accept' }))) ?? { accepted: true };
	},
	counter: async ({ params, request }) => {
		const parsed = parseForm(Counter, await request.formData());
		if (!parsed.ok) return parsed.failure;
		const { messageId, amount } = parsed.data;
		return (await guard(() => api.respondToOffer(requireId(params.id), messageId, { kind: 'counter', amount }))) ?? { countered: true };
	}
};
