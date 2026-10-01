import { describe, expect, it } from 'vitest';
import { safeBack } from './prefs';

describe('safeBack', () => {
	it('keeps same-origin paths', () => {
		expect(safeBack('/favoritos?filtro=vendidos')).toBe('/favoritos?filtro=vendidos');
	});

	it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/a\r\nSet-Cookie: x=1', null])(
		'rejects %s',
		(value) => {
			expect(safeBack(value)).toBe('/');
		}
	);
});
