/**
 * In-memory implementation of the Baratex API, used until the real backend
 * exists. State lives in this process and resets on restart.
 *
 * Every value handed back is parsed with the shared Zod schemas, the same way
 * the HTTP client will parse real responses, so the UI never sees data that
 * breaks the contract.
 */
import { z } from 'zod';
import {
	AiAnswer,
	CartItem,
	Conversation,
	Favorite,
	Listing,
	SavedSearch,
	User,
	type AiRequest,
	type FilterKey,
	type NewListingInput,
	type SearchFilter
} from '$lib/api/schemas';
import {
	ApiError,
	type BaratexApi,
	type FeedQuery,
	type ListingWithSeller
} from '$lib/api/types';
import { formatBRL, formatKm } from '$lib/utils/format';
import * as seed from '../mock/data';

const clone = <T>(value: T): T => structuredClone(value);

/** Mutable copy of the seed so tests and restarts start from the same state. */
function createState() {
	return {
		users: clone(seed.users),
		listings: clone(seed.listings),
		favorites: clone(seed.favorites),
		conversations: clone(seed.conversations),
		savedSearches: clone(seed.savedSearches),
		cart: [] as CartItem[]
	};
}

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}`;
const nowIso = () => new Date().toISOString();

const normalize = (text: string) =>
	text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');

const specValue = (listing: Listing, label: string) =>
	listing.specs.find((s) => s.label === label)?.value;

const weightKg = (listing: Listing) => {
	const raw = specValue(listing, 'Peso');
	return raw ? Number.parseFloat(raw.replace(',', '.')) : undefined;
};

const KEYWORDS: { words: string[]; label: string; match: (l: Listing) => boolean }[] = [
	{ words: ['carrinho'], label: 'Carrinho de bebê', match: (l) => l.category === 'bebe' && /carrinho/i.test(l.title) },
	{ words: ['bicicleta', 'bike'], label: 'Bicicleta', match: (l) => /bicicleta/i.test(l.title) },
	{ words: ['jaqueta'], label: 'Jaqueta', match: (l) => /jaqueta/i.test(l.title) },
	{ words: ['sofa'], label: 'Sofá', match: (l) => /sof/i.test(l.title) },
	{ words: ['mesa'], label: 'Mesa', match: (l) => /mesa/i.test(l.title) },
	{ words: ['vinil', 'disco'], label: 'Vinil', match: (l) => /vinil/i.test(l.title) },
	{ words: ['fone'], label: 'Fone', match: (l) => /fone/i.test(l.title) },
	{ words: ['monitor'], label: 'Monitor', match: (l) => /monitor/i.test(l.title) },
	{ words: ['vintage', 'brecho'], label: 'Moda vintage', match: (l) => l.subcategoryPath.includes('Vintage') }
];

export function createMockApi(): BaratexApi & { reset(): void } {
	let db = createState();

	const user = (id: string) => {
		const found = db.users.find((u) => u.id === id);
		if (!found) throw new ApiError(500, `Unknown user ${id}`);
		return User.parse(found);
	};
	const findListing = (id: string) => db.listings.find((l) => l.id === id);
	const requireListing = (id: string) => {
		const found = findListing(id);
		if (!found) throw new ApiError(404, 'Anúncio não encontrado');
		return found;
	};
	const isFavorite = (id: string) => db.favorites.some((f) => f.listingId === id);
	const withSeller = (listing: Listing): ListingWithSeller => ({
		listing: Listing.parse(listing),
		seller: user(listing.sellerId),
		favorite: isFavorite(listing.id)
	});
	const viewerId = seed.VIEWER_ID;

	function runSearch(request: AiRequest, radiusKm: number | null) {
		const text = normalize(`${request.context} ${request.message}`);
		const off = new Set<FilterKey>(request.disabled);
		const filters: SearchFilter[] = [];

		const keyword = KEYWORDS.find((k) => k.words.some((w) => text.includes(w)));
		if (keyword && !off.has('category')) {
			filters.push({ key: 'category', label: 'Categoria', value: keyword.label });
		}
		const priceMatch = /(?:ate|maximo|max\.?)\s*r?\$?\s*(\d{1,6})/.exec(text);
		const maxPrice = priceMatch?.[1] ? Number(priceMatch[1]) * 100 : undefined;
		if (maxPrice !== undefined && !off.has('maxPrice')) {
			filters.push({ key: 'maxPrice', label: 'Até', value: formatBRL(maxPrice) });
		}
		const deliveryOnly = /so com entrega|com entrega/.test(text);
		const radius = deliveryOnly ? null : (radiusKm ?? null);
		if (radius !== null && !off.has('radius')) {
			filters.push({ key: 'radius', label: 'Raio', value: `${formatKm(radius)} de ${user(viewerId).neighborhood}` });
		}
		const wantsLight = /\bleve\b/.test(text);
		if (wantsLight && !off.has('weight')) {
			filters.push({ key: 'weight', label: 'Peso', value: 'leve (< 8 kg)' });
		}
		const oneHand = /(uma|1) mao/.test(text);
		if (oneHand && !off.has('needs')) {
			filters.push({ key: 'needs', label: 'Precisa', value: 'fechar com 1 mão' });
		}
		if (!off.has('delivery')) {
			filters.push({ key: 'delivery', label: 'Receber', value: deliveryOnly ? 'só entrega' : 'entrega ou retirada' });
		}
		const active = new Set(filters.map((f) => f.key));

		const tokens = text.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
		const broad = db.listings.filter((l) => {
			if (l.status !== 'available' || l.sellerId === viewerId) return false;
			if (active.has('category') && keyword && !keyword.match(l)) return false;
			if (!keyword) {
				const hay = normalize(`${l.title} ${l.description}`);
				if (!tokens.some((t) => hay.includes(t))) return false;
			}
			if (active.has('maxPrice') && maxPrice !== undefined && l.price > maxPrice) return false;
			if (active.has('radius') && radius !== null && l.distanceKm > radius) return false;
			if (deliveryOnly && l.shipping.deliveryPrice === null) return false;
			return true;
		});
		const strict = broad.filter((l) => {
			const kg = weightKg(l);
			if (active.has('weight') && (kg === undefined || kg >= 8)) return false;
			if (active.has('needs') && specValue(l, 'Fechamento') !== 'uma mão') return false;
			return true;
		});
		return { broad, strict, keyword, filters, radius };
	}

	function reasonFor(listing: Listing) {
		const weight = specValue(listing, 'Peso');
		const oneHand = specValue(listing, 'Fechamento') === 'uma mão';
		const first = listing.description.split(/(?<=\.)\s/)[0] ?? '';
		// Skip facts the seller's own sentence already states.
		const facts = [weight, oneHand && !/m[aã]o/i.test(first) ? 'fecha com uma mão' : undefined].filter(Boolean);
		const lead = facts.length ? `${facts.join(', ')}. ` : '';
		return `${lead}${first}`.trim().slice(0, 200);
	}

	const api: BaratexApi & { reset(): void } = {
		reset() {
			db = createState();
		},

		async viewer() {
			return user(viewerId);
		},

		async people(ids) {
			const known = ids.filter((id) => db.users.some((u) => u.id === id));
			return Object.fromEntries(known.map((id) => [id, user(id)]));
		},

		async counts() {
			return {
				unreadMessages: db.conversations.reduce((n, c) => n + c.unread, 0),
				favorites: db.favorites.length,
				cart: db.cart.length
			};
		},

		async feed(query: FeedQuery) {
			const items = db.listings.filter((l) => {
				if (l.status !== 'available' || l.sellerId === viewerId) return false;
				if (query.category && l.category !== query.category) return false;
				if (query.radiusKm === null) return l.shipping.deliveryPrice !== null;
				return l.distanceKm <= query.radiusKm;
			});
			const sorters = {
				recent: (a: Listing, b: Listing) => b.postedAt.localeCompare(a.postedAt),
				nearest: (a: Listing, b: Listing) => a.distanceKm - b.distanceKm,
				cheapest: (a: Listing, b: Listing) => a.price - b.price
			};
			return items.sort(sorters[query.sort]).map(withSeller);
		},

		async listing(id) {
			const found = findListing(id);
			if (!found) return null;
			const base = withSeller(found);
			const peopleIds = new Set(found.comments.map((c) => c.authorId));
			const sellerListings = db.listings.filter((l) => l.sellerId === found.sellerId && l.status === 'available');
			return {
				...base,
				people: Object.fromEntries([...peopleIds].map((pid) => [pid, user(pid)])),
				moreFromSeller: sellerListings.filter((l) => l.id !== id).slice(0, 6).map((l) => Listing.parse(l)),
				sellerListingCount: sellerListings.length
			};
		},

		async addComment(listingId, text, replyTo) {
			const target = requireListing(listingId);
			if (replyTo && !target.comments.some((c) => c.id === replyTo)) {
				throw new ApiError(400, 'Comentário original não existe');
			}
			target.comments.push({
				id: newId('c'),
				authorId: viewerId,
				text,
				createdAt: nowIso(),
				...(replyTo ? { replyTo } : {})
			});
		},

		async favorites() {
			return [...db.favorites]
				.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
				.map((favorite) => {
					const listing = requireListing(favorite.listingId);
					return { favorite: Favorite.parse(favorite), listing: Listing.parse(listing), seller: user(listing.sellerId) };
				});
		},

		async toggleFavorite(listingId) {
			const listing = requireListing(listingId);
			const index = db.favorites.findIndex((f) => f.listingId === listingId);
			if (index >= 0) {
				db.favorites.splice(index, 1);
				return false;
			}
			db.favorites.push({
				listingId,
				addedAt: nowIso(),
				badge: listing.status === 'sold' ? { kind: 'sold' } : { kind: 'available' }
			});
			return true;
		},

		async discoverDeck() {
			return db.listings
				.filter((l) => l.status === 'available' && l.subcategoryPath.includes('Vintage') && !isFavorite(l.id))
				.map(withSeller);
		},

		async conversations() {
			return db.conversations
				.map((c) => {
					const conversation = Conversation.parse(c);
					const otherId = c.buyerId === viewerId ? c.sellerId : c.buyerId;
					return { conversation, listing: Listing.parse(requireListing(c.listingId)), other: user(otherId) };
				})
				.sort((a, b) => {
					const last = (c: Conversation) => c.messages.at(-1)?.createdAt ?? '';
					return last(b.conversation).localeCompare(last(a.conversation));
				});
		},

		async conversation(id) {
			const found = db.conversations.find((c) => c.id === id);
			if (!found) return null;
			// Opening a conversation marks it as read.
			found.unread = 0;
			const otherId = found.buyerId === viewerId ? found.sellerId : found.buyerId;
			return {
				conversation: Conversation.parse(found),
				listing: Listing.parse(requireListing(found.listingId)),
				other: user(otherId),
				viewer: user(viewerId)
			};
		},

		async sendMessage(conversationId, text) {
			const conv = db.conversations.find((c) => c.id === conversationId);
			if (!conv) throw new ApiError(404, 'Conversa não encontrada');
			conv.messages.push({ kind: 'text', id: newId('m'), authorId: viewerId, text, createdAt: nowIso() });
		},

		async makeOffer(listingId, amount) {
			const listing = requireListing(listingId);
			if (listing.status !== 'available') throw new ApiError(409, 'Esta peça já foi vendida');
			if (listing.sellerId === viewerId) throw new ApiError(400, 'Você não pode ofertar na sua própria peça');
			if (amount >= listing.price) throw new ApiError(400, 'A oferta precisa ser menor que o preço');
			if (amount < Math.round(listing.price * 0.5)) throw new ApiError(400, 'Oferta abaixo de 50% do preço');

			let conv = db.conversations.find((c) => c.listingId === listingId && c.buyerId === viewerId);
			if (!conv) {
				conv = { id: newId('conv'), listingId, buyerId: viewerId, sellerId: listing.sellerId, unread: 0, messages: [] };
				db.conversations.push(conv);
			}
			for (const m of conv.messages) if (m.kind === 'offer' && m.status === 'pending') m.status = 'declined';
			conv.messages.push({
				kind: 'offer',
				id: newId('m'),
				authorId: viewerId,
				amount,
				status: 'pending',
				createdAt: nowIso(),
				expiresAt: new Date(Date.now() + 24 * 3_600_000).toISOString()
			});
			const fav = db.favorites.find((f) => f.listingId === listingId);
			if (fav) fav.badge = { kind: 'offer_sent', amount };
			return conv.id;
		},

		async respondToOffer(conversationId, messageId, response) {
			const conv = db.conversations.find((c) => c.id === conversationId);
			if (!conv) throw new ApiError(404, 'Conversa não encontrada');
			const offer = conv.messages.find((m) => m.id === messageId);
			if (!offer || offer.kind !== 'offer') throw new ApiError(404, 'Oferta não encontrada');
			if (offer.authorId === viewerId) throw new ApiError(400, 'Você não pode responder à sua própria oferta');
			if (offer.status !== 'pending') throw new ApiError(409, 'Esta oferta já foi respondida');

			if (response.kind === 'accept') {
				offer.status = 'accepted';
				conv.messages.push({
					kind: 'text',
					id: newId('m'),
					authorId: viewerId,
					text: `Fechado por ${formatBRL(offer.amount)}! Vou pagar pelo baratex.`,
					createdAt: nowIso()
				});
				return;
			}
			if (response.amount <= offer.amount) throw new ApiError(400, 'A contraproposta precisa ser diferente');
			offer.status = 'countered';
			conv.messages.push({
				kind: 'offer',
				id: newId('m'),
				authorId: viewerId,
				amount: response.amount,
				status: 'pending',
				createdAt: nowIso(),
				expiresAt: new Date(Date.now() + 24 * 3_600_000).toISOString()
			});
		},

		async aiSearch(request, radiusKm) {
			const message = normalize(request.message);
			const wantsCompare = /compar/.test(message);
			const asksTrade = /troca/.test(message);
			// Follow-up questions keep the previous search; anything else refines it.
			const search = wantsCompare || asksTrade ? { ...request, message: '' } : request;
			const { broad, strict, keyword, filters, radius } = runSearch(search, radiusKm);
			const picks = strict.slice(0, 3);
			const query = [search.context, search.message].filter(Boolean).join(' ').trim();
			const place = radius === null ? 'com entrega' : `até ${formatKm(radius)}`;
			const noun = keyword ? keyword.label.toLowerCase() : 'peças';

			let intro: string;
			let outro: string;
			let shown = picks;
			if (wantsCompare && picks.length >= 2) {
				const [a, b] = picks as [Listing, Listing];
				const cheaper = a.price <= b.price ? a : b;
				const closer = a.distanceKm <= b.distanceKm ? a : b;
				shown = [a, b];
				intro = `Comparando os dois: o mais barato é “${cheaper.title}” (${formatBRL(cheaper.price)}) e o mais perto é “${closer.title}” (${formatKm(closer.distanceKm)}).`;
				outro = 'Os dois aceitam oferta. Quer que eu pergunte algo aos vendedores?';
			} else if (asksTrade) {
				shown = [];
				intro = `Nenhum dos ${picks.length} anúncios fala em troca.`;
				outro = 'Posso mandar uma pergunta para os vendedores e te aviso quando responderem.';
			} else if (broad.length === 0) {
				shown = [];
				intro = `Não achei ${noun} ${place} com esses filtros.`;
				outro = 'Tente aumentar o raio ou o preço. Também posso publicar um Procura-se e te avisar quando aparecer.';
			} else {
				intro = `Procurei em tudo que está à venda ${place} e achei ${broad.length} ${broad.length === 1 ? 'resultado' : 'resultados'} nessa faixa. ${
					picks.length ? `${picks.length === 1 ? 'Este é o que mais bate' : `Estes ${picks.length} são os que mais batem`}, conferi as fotos, a descrição e os comentários de cada um:` : 'Nenhum bate com tudo o que você pediu.'
				}`;
				const rest = broad.length - picks.length;
				outro = rest > 0
					? `Os outros ${rest} não atendem a tudo o que você pediu. Quer que eu publique um Procura-se para quem vende perto de você e te avise quando aparecer algo novo?`
					: 'Quer que eu publique um Procura-se e te avise quando aparecer algo novo?';
			}

			const answer = AiAnswer.parse({
				query,
				intro,
				totalFound: broad.length,
				picks: shown.map((l) => ({ listingId: l.id, reason: reasonFor(l) })),
				outro,
				candidateIds: broad.map((l) => l.id),
				filters,
				suggestions: ['Só com entrega', 'Compare o 1 e o 2', 'Algum aceita troca?'],
				offerAlert: !asksTrade
			});
			return { answer, results: broad.map(withSeller) };
		},

		async savedSearches() {
			return db.savedSearches.map((s) => SavedSearch.parse(s));
		},

		async saveSearch(label) {
			const clean = label.trim().slice(0, 80);
			if (!clean || db.savedSearches.some((s) => s.label === clean)) return;
			db.savedSearches.unshift({ id: newId('s'), label: clean, newCount: 0 });
		},

		async cart() {
			return db.cart.map((item) => {
				const listing = requireListing(item.listingId);
				return { item: CartItem.parse(item), listing: Listing.parse(listing), seller: user(listing.sellerId) };
			});
		},

		async addToCart(listingId, delivery) {
			const listing = requireListing(listingId);
			if (listing.status !== 'available') throw new ApiError(409, 'Esta peça já foi vendida');
			if (delivery === 'entrega' && listing.shipping.deliveryPrice === null) {
				throw new ApiError(400, 'Esta peça não tem entrega');
			}
			db.cart = db.cart.filter((c) => c.listingId !== listingId);
			db.cart.push({ listingId, delivery, addedAt: nowIso() });
		},

		async removeFromCart(listingId) {
			db.cart = db.cart.filter((c) => c.listingId !== listingId);
		},

		async mySales() {
			return db.listings.filter((l) => l.sellerId === viewerId).map((l) => Listing.parse(l));
		},

		async createListing(input: NewListingInput) {
			const id = newId('l');
			const me = user(viewerId);
			db.listings.unshift(
				Listing.parse({
					id,
					sellerId: viewerId,
					title: input.title,
					description: input.description,
					category: input.category,
					subcategoryPath: [],
					condition: input.condition,
					price: input.price,
					photos: Array.from({ length: input.photoCount }, (_, i) => ({ src: null, alt: `${input.title}, foto ${i + 1}` })),
					tags: [],
					specs: [],
					postedAt: nowIso(),
					distanceKm: 0,
					neighborhood: me.neighborhood,
					shipping: { deliveryPrice: null, deliveryEta: null, pickupSpotKm: 0 },
					hasInvoice: false,
					acceptsOffers: true,
					status: 'available',
					fairPrice: null,
					comments: []
				} satisfies z.input<typeof Listing>)
			);
			return id;
		}
	};
	return api;
}
