import { api } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('app:counts');
	const [viewer, counts] = await Promise.all([api.viewer(), api.counts()]);
	return { viewer, counts, radiusKm: locals.radiusKm };
};
