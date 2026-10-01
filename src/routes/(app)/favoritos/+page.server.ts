import { z } from 'zod';
import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

const Query = z.object({
	filtro: z.enum(['todos', 'baixou', 'oferta', 'disponiveis', 'vendidos']).catch('todos'),
	ordem: z.enum(['recentes', 'preco', 'perto']).catch('recentes')
});

export const load: PageServerLoad = async ({ url }) => {
	const { filtro, ordem } = Query.parse(Object.fromEntries(url.searchParams));
	const all = await api.favorites();
	const counts = {
		todos: all.length,
		baixou: all.filter((f) => f.favorite.badge.kind === 'price_drop').length,
		oferta: all.filter((f) => f.favorite.badge.kind === 'offer_sent').length,
		disponiveis: all.filter((f) => f.listing.status === 'available').length,
		vendidos: all.filter((f) => f.listing.status === 'sold').length
	};
	const filtered = all.filter((f) => {
		switch (filtro) {
			case 'baixou':
				return f.favorite.badge.kind === 'price_drop';
			case 'oferta':
				return f.favorite.badge.kind === 'offer_sent';
			case 'disponiveis':
				return f.listing.status === 'available';
			case 'vendidos':
				return f.listing.status === 'sold';
			default:
				return true;
		}
	});
	if (ordem === 'preco') filtered.sort((a, b) => a.listing.price - b.listing.price);
	if (ordem === 'perto') filtered.sort((a, b) => a.listing.distanceKm - b.listing.distanceKm);
	return { items: filtered, counts, filtro, ordem };
};
