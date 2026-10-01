import type {
	AiAnswer,
	AiRequest,
	CartItem,
	Category,
	Conversation,
	Favorite,
	Listing,
	NewListingInput,
	SavedSearch,
	User
} from './schemas';

export type FeedSort = 'recent' | 'nearest' | 'cheapest';

export interface FeedQuery {
	category?: Category;
	/** `null` means "anywhere, delivery only". */
	radiusKm: number | null;
	sort: FeedSort;
}

export interface ListingWithSeller {
	listing: Listing;
	seller: User;
	favorite: boolean;
}

export interface ListingDetail extends ListingWithSeller {
	people: Record<string, User>;
	moreFromSeller: Listing[];
	sellerListingCount: number;
}

export interface FavoriteItem {
	favorite: Favorite;
	listing: Listing;
	seller: User;
}

export interface ConversationSummary {
	conversation: Conversation;
	listing: Listing;
	other: User;
}

export interface ConversationDetail extends ConversationSummary {
	viewer: User;
}

export interface Counts {
	unreadMessages: number;
	favorites: number;
	cart: number;
}

export interface AiChatTurn {
	answer: AiAnswer;
	results: ListingWithSeller[];
}

/**
 * Everything the frontend needs from the backend. Today it is implemented by
 * an in-memory mock (`$lib/server/api/mock.ts`); the real HTTP client will
 * implement the same interface so routes never change.
 *
 * Calls run on the server only (inside `load` functions and form actions), so
 * session tokens and the backend URL never reach the browser.
 */
export interface BaratexApi {
	viewer(): Promise<User>;
	counts(): Promise<Counts>;
	people(ids: string[]): Promise<Record<string, User>>;

	feed(query: FeedQuery): Promise<ListingWithSeller[]>;
	listing(id: string): Promise<ListingDetail | null>;
	addComment(listingId: string, text: string, replyTo?: string): Promise<void>;

	favorites(): Promise<FavoriteItem[]>;
	toggleFavorite(listingId: string): Promise<boolean>;

	discoverDeck(): Promise<ListingWithSeller[]>;

	conversations(): Promise<ConversationSummary[]>;
	conversation(id: string): Promise<ConversationDetail | null>;
	sendMessage(conversationId: string, text: string): Promise<void>;
	makeOffer(listingId: string, amount: number): Promise<string>;
	respondToOffer(
		conversationId: string,
		messageId: string,
		response: { kind: 'accept' } | { kind: 'counter'; amount: number }
	): Promise<void>;

	aiSearch(request: AiRequest, radiusKm: number | null): Promise<AiChatTurn>;
	savedSearches(): Promise<SavedSearch[]>;
	saveSearch(label: string): Promise<void>;

	cart(): Promise<{ item: CartItem; listing: Listing; seller: User }[]>;
	addToCart(listingId: string, delivery: CartItem['delivery']): Promise<void>;
	removeFromCart(listingId: string): Promise<void>;

	mySales(): Promise<Listing[]>;
	createListing(input: NewListingInput): Promise<string>;
}

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}
