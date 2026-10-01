/**
 * Data contracts between the frontend and the (future) Baratex backend.
 *
 * Every payload that crosses the API boundary is parsed with these schemas, so
 * a malformed or hostile response fails loudly instead of reaching the UI.
 * Money is always an integer number of centavos to avoid float rounding.
 */
import { z } from 'zod';

export const Id = z.string().regex(/^[a-z0-9_-]{1,64}$/i);
export const Cents = z.number().int().nonnegative().max(100_000_000_00);
export const IsoDate = z.iso.datetime();

export const User = z.object({
	id: Id,
	name: z.string().min(1).max(80),
	handle: z.string().min(1).max(40),
	rating: z.number().min(0).max(5),
	salesCount: z.number().int().nonnegative(),
	neighborhood: z.string().max(80),
	responseTime: z.string().max(40),
	verified: z.boolean()
});
export type User = z.infer<typeof User>;

export const Category = z.enum(['casa', 'moda', 'eletronicos', 'esportes', 'bebe', 'lazer']);
export type Category = z.infer<typeof Category>;

export const Condition = z.enum(['novo', 'como_novo', 'muito_bom', 'bom']);
export type Condition = z.infer<typeof Condition>;

export const Photo = z.object({
	/** Same-origin path only. Remote URLs are rejected until the backend serves images. */
	src: z
		.string()
		.regex(/^\/images\/[a-z0-9-]+\.(jpg|png|webp|avif)$/)
		.nullable(),
	alt: z.string().max(140),
	note: z.string().max(80).optional()
});
export type Photo = z.infer<typeof Photo>;

export const Comment = z.object({
	id: Id,
	authorId: Id,
	text: z.string().min(1).max(500),
	createdAt: IsoDate,
	replyTo: Id.optional()
});
export type Comment = z.infer<typeof Comment>;

export const Listing = z.object({
	id: Id,
	sellerId: Id,
	title: z.string().min(3).max(80),
	description: z.string().max(2000),
	category: Category,
	subcategoryPath: z.array(z.string().max(40)).max(4),
	condition: Condition,
	price: Cents,
	photos: z.array(Photo).min(1).max(12),
	tags: z.array(z.string().max(40)).max(8),
	specs: z.array(z.object({ label: z.string().max(30), value: z.string().max(60) })).max(12),
	postedAt: IsoDate,
	distanceKm: z.number().nonnegative(),
	neighborhood: z.string().max(80),
	shipping: z.object({
		deliveryPrice: Cents.nullable(),
		deliveryEta: z.string().max(40).nullable(),
		pickupSpotKm: z.number().nonnegative().nullable()
	}),
	hasInvoice: z.boolean(),
	acceptsOffers: z.boolean(),
	status: z.enum(['available', 'sold']),
	fairPrice: z.object({ min: Cents, max: Cents }).nullable(),
	comments: z.array(Comment)
});
export type Listing = z.infer<typeof Listing>;

export const FavoriteBadge = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('offer_sent'), amount: Cents }),
	z.object({ kind: z.literal('price_drop'), amount: Cents }),
	z.object({ kind: z.literal('new_tag') }),
	z.object({ kind: z.literal('new_comments'), count: z.number().int().positive() }),
	z.object({ kind: z.literal('available') }),
	z.object({ kind: z.literal('sold') })
]);
export type FavoriteBadge = z.infer<typeof FavoriteBadge>;

export const Favorite = z.object({
	listingId: Id,
	addedAt: IsoDate,
	badge: FavoriteBadge
});
export type Favorite = z.infer<typeof Favorite>;

export const Message = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('text'),
		id: Id,
		authorId: Id,
		text: z.string().min(1).max(1000),
		createdAt: IsoDate
	}),
	z.object({
		kind: z.literal('offer'),
		id: Id,
		authorId: Id,
		amount: Cents,
		status: z.enum(['pending', 'accepted', 'countered', 'declined']),
		createdAt: IsoDate,
		expiresAt: IsoDate
	})
]);
export type Message = z.infer<typeof Message>;

export const Conversation = z.object({
	id: Id,
	listingId: Id,
	buyerId: Id,
	sellerId: Id,
	messages: z.array(Message),
	unread: z.number().int().nonnegative()
});
export type Conversation = z.infer<typeof Conversation>;

export const SavedSearch = z.object({
	id: Id,
	label: z.string().max(80),
	newCount: z.number().int().nonnegative()
});
export type SavedSearch = z.infer<typeof SavedSearch>;

export const SearchFilter = z.object({
	key: z.enum(['category', 'maxPrice', 'radius', 'weight', 'needs', 'delivery']),
	label: z.string().max(30),
	value: z.string().max(60)
});
export type SearchFilter = z.infer<typeof SearchFilter>;
export type FilterKey = SearchFilter['key'];

export const AiRequest = z.object({
	/** The search so far; refinements are appended to it. */
	context: z.string().trim().max(500).default(''),
	message: z.string().trim().min(1, 'Escreva o que você procura').max(300),
	disabled: z.array(SearchFilter.shape.key).max(6).default([])
});
export type AiRequest = z.infer<typeof AiRequest>;

export const AiAnswer = z.object({
	query: z.string().max(500),
	intro: z.string().max(500),
	totalFound: z.number().int().nonnegative(),
	picks: z.array(z.object({ listingId: Id, reason: z.string().max(200) })).max(5),
	outro: z.string().max(500),
	/** Every listing that matched the broad search, not only the picks. */
	candidateIds: z.array(Id).max(50),
	filters: z.array(SearchFilter).max(8),
	suggestions: z.array(z.string().max(40)).max(4),
	offerAlert: z.boolean()
});
export type AiAnswer = z.infer<typeof AiAnswer>;

export const CartItem = z.object({
	listingId: Id,
	delivery: z.enum(['entrega', 'retirar']),
	addedAt: IsoDate
});
export type CartItem = z.infer<typeof CartItem>;

/** Input accepted when a user publishes a new listing. */
export const NewListingInput = z.object({
	title: z.string().trim().min(3, 'Título muito curto').max(80, 'Título muito longo'),
	description: z.string().trim().max(2000).default(''),
	category: Category,
	condition: Condition,
	price: Cents.min(100, 'Preço mínimo de R$ 1'),
	photoCount: z.number().int().min(1, 'Adicione pelo menos uma foto').max(12)
});
export type NewListingInput = z.infer<typeof NewListingInput>;
