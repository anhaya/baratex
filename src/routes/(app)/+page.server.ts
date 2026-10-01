import { z } from 'zod';
import { Category } from '$lib/api/schemas';
import type { FeedSort } from '$lib/api/types';
import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

const Query = z.object({
	categoria: Category.optional().catch(undefined),
	ordem: z.enum(['recent', 'nearest', 'cheapest']).catch('recent'),
	pagina: z.coerce.number().int().min(1).max(50).catch(1)
});

const PAGE_SIZE = 8;

export const load: PageServerLoad = async ({ url, locals }) => {
	const query = Query.parse(Object.fromEntries(url.searchParams));
	const sort: FeedSort = query.ordem;
	const all = await api.feed({ category: query.categoria, radiusKm: locals.radiusKm, sort });
	const items = all.slice(0, query.pagina * PAGE_SIZE);
	const authorIds = [...new Set(items.flatMap((i) => i.listing.comments.map((c) => c.authorId)))];
	const people = await api.people(authorIds);
	return { items, people, category: query.categoria ?? null, sort, page: query.pagina, hasMore: all.length > items.length };
};
