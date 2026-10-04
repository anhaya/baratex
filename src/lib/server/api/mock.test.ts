import { beforeEach, describe, expect, it } from 'vitest';
import { Photo } from '$lib/api/schemas';
import { ApiError } from '$lib/api/types';
import { createMockApi } from './mock';

const api = createMockApi();
beforeEach(() => api.reset());

describe('mock api', () => {
	it('filters the feed by radius and keeps delivery-only items for "anywhere"', async () => {
		const near = await api.feed({ radiusKm: 1, sort: 'recent' });
		expect(near.every((i) => i.listing.distanceKm <= 1)).toBe(true);
		const anywhere = await api.feed({ radiusKm: null, sort: 'recent' });
		expect(anywhere.every((i) => i.listing.shipping.deliveryPrice !== null)).toBe(true);
		expect(anywhere.some((i) => i.listing.status === 'sold')).toBe(false);
	});

	it('answers the stroller search from the design', async () => {
		const { answer } = await api.aiSearch(
			{
				context: '',
				message: 'Procuro um carrinho de bebê leve, que feche com uma mão. Até R$ 400, perto de Pinheiros.',
				disabled: []
			},
			5
		);
		expect(answer.totalFound).toBe(6);
		expect(answer.picks.map((p) => p.listingId)).toEqual(['carrinho-conforto', 'carrinho-viagem', 'carrinho-reversivel']);
		expect(answer.filters.map((f) => f.key)).toEqual(['category', 'maxPrice', 'radius', 'weight', 'needs', 'delivery']);
	});

	it('widens the picks when a filter is removed', async () => {
		const { answer } = await api.aiSearch(
			{ context: '', message: 'carrinho leve que feche com uma mão até R$ 400', disabled: ['weight', 'needs'] },
			5
		);
		expect(answer.picks).toHaveLength(3);
		expect(answer.filters.some((f) => f.key === 'weight')).toBe(false);
	});

	it('rejects offers above the price or far too low', async () => {
		await expect(api.makeOffer('bike-amarela', 70_000)).rejects.toBeInstanceOf(ApiError);
		await expect(api.makeOffer('bike-amarela', 10_000)).rejects.toBeInstanceOf(ApiError);
		await expect(api.makeOffer('bike-preta', 50_000)).rejects.toThrow(/vendida/);
	});

	it('opens a conversation for a new offer and marks the favorite', async () => {
		const id = await api.makeOffer('bike-lilas', 48_000);
		const conv = await api.conversation(id);
		expect(conv?.conversation.messages.at(-1)).toMatchObject({ kind: 'offer', amount: 48_000, status: 'pending' });
		const fav = (await api.favorites()).find((f) => f.listing.id === 'bike-lilas');
		expect(fav?.favorite.badge).toEqual({ kind: 'offer_sent', amount: 48_000 });
	});

	it('accepts a counter offer only once', async () => {
		await api.respondToOffer('conv-marina', 'm4', { kind: 'accept' });
		await expect(api.respondToOffer('conv-marina', 'm4', { kind: 'accept' })).rejects.toThrow(/respondida/);
	});

	it('toggles favorites', async () => {
		expect(await api.toggleFavorite('fone-bt')).toBe(true);
		expect(await api.toggleFavorite('fone-bt')).toBe(false);
	});
});

describe('schemas', () => {
	it('only accepts same-origin image paths', () => {
		expect(Photo.safeParse({ src: '/images/stock-01.jpg', alt: 'x' }).success).toBe(true);
		expect(Photo.safeParse({ src: 'https://evil.example/x.jpg', alt: 'x' }).success).toBe(false);
		expect(Photo.safeParse({ src: 'javascript:alert(1)', alt: 'x' }).success).toBe(false);
	});
});
