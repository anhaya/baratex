import { describe, expect, it } from 'vitest';
import { formatBRL, formatKm, parseBRL, timeAgo } from './format';
import { buyerTotal, daysToSell, protectionFee, sellerNet } from './pricing';

describe('format', () => {
	it('formats centavos as reais', () => {
		expect(formatBRL(65_000)).toBe('R$ 650');
		expect(formatBRL(1_250)).toBe('R$ 12,5');
		expect(formatBRL(125_000_00)).toBe('R$ 125.000');
	});

	it('parses what people type', () => {
		expect(parseBRL('650')).toBe(65_000);
		expect(parseBRL('650,50')).toBe(65_050);
		expect(parseBRL('1.250')).toBe(125_000);
		expect(parseBRL('R$ 1.250,99')).toBe(125_099);
		expect(parseBRL('')).toBeNull();
		expect(parseBRL('abc')).toBeNull();
	});

	it('formats distances', () => {
		expect(formatKm(2.1)).toBe('2,1 km');
		expect(formatKm(5)).toBe('5 km');
		expect(formatKm(0.8)).toBe('800 m');
	});

	it('describes elapsed time', () => {
		const now = Date.parse('2026-10-01T12:00:00Z');
		expect(timeAgo('2026-10-01T11:20:00Z', now)).toBe('há 40 min');
		expect(timeAgo('2026-10-01T10:00:00Z', now)).toBe('há 2 h');
		expect(timeAgo('2026-09-28T12:00:00Z', now)).toBe('há 3 dias');
	});
});

describe('pricing', () => {
	it('adds delivery and protection to the buyer total', () => {
		expect(protectionFee(65_000)).toBe(2_600);
		expect(protectionFee(1_000)).toBe(300);
		expect(buyerTotal(65_000, 4_200)).toBe(71_800);
		expect(buyerTotal(65_000, null)).toBe(67_600);
	});

	it('takes the seller fee out of the payout', () => {
		expect(sellerNet(65_000)).toBe(58_500);
	});

	it('estimates faster sales for cheaper prices', () => {
		const range = { min: 45_000, max: 85_000 };
		expect(daysToSell(45_000, range)).toBeLessThan(daysToSell(85_000, range));
	});
});
