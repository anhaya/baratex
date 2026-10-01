import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? files(path) : path.endsWith('.svelte') ? [path] : [];
	});
}

const components = files('src');

describe('template guardrails', () => {
	it('never renders raw HTML', () => {
		const offenders = components.filter((f) => readFileSync(f, 'utf8').includes('{@html'));
		expect(offenders).toEqual([]);
	});

	it('never uses inline style attributes (the CSP blocks them)', () => {
		const offenders = components.filter((f) => /\sstyle(=|:)/.test(readFileSync(f, 'utf8').replace(/<style[\s\S]*?<\/style>/g, '')));
		expect(offenders).toEqual([]);
	});
});
