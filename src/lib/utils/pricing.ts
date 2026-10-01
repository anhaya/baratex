/**
 * Fee rules shown in the UI. These are placeholders until the backend owns
 * pricing; the backend must recompute every total itself and never trust a
 * number sent from the browser.
 */
export const PROTECTION_RATE = 0.04;
export const PROTECTION_MIN = 300;
export const SELLER_FEE_RATE = 0.1;

export function protectionFee(price: number): number {
	return Math.max(PROTECTION_MIN, Math.round(price * PROTECTION_RATE));
}

export function buyerTotal(price: number, delivery: number | null): number {
	return price + (delivery ?? 0) + protectionFee(price);
}

export function sellerNet(price: number): number {
	return price - Math.round(price * SELLER_FEE_RATE);
}

/** Rough "sells in N days" estimate from where the price sits in the fair range. */
export function daysToSell(price: number, range: { min: number; max: number } | null): number {
	if (!range || range.max <= range.min) return 7;
	const position = Math.min(1, Math.max(0, (price - range.min) / (range.max - range.min)));
	return Math.max(1, Math.round(2 + position * 12));
}

/** 0–1 position of a price inside its fair range, clamped. */
export function fairPosition(price: number, range: { min: number; max: number }): number {
	if (range.max <= range.min) return 0.5;
	return Math.min(1, Math.max(0, (price - range.min) / (range.max - range.min)));
}
