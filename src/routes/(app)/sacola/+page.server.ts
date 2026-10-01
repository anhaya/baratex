import { z } from 'zod';
import { Id } from '$lib/api/schemas';
import { api } from '$lib/server/api';
import { parseForm } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ items: await api.cart() });

export const actions: Actions = {
	remove: async ({ request }) => {
		const parsed = parseForm(z.object({ listingId: Id }), await request.formData());
		if (!parsed.ok) return parsed.failure;
		await api.removeFromCart(parsed.data.listingId);
		return { removed: true };
	},
	checkout: async () => {
		// Payment is not wired up yet: the backend will create the escrow payment.
		return { checkout: 'mock' as const };
	}
};
