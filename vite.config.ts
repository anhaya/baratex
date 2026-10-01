import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// Keep the source out of production bundles.
		sourcemap: false,
		// Never inline assets as data: URIs, so the CSP can stay strict.
		assetsInlineLimit: 0
	},
	server: {
		fs: { strict: true }
	},
	test: {
		include: ['src/**/*.test.ts']
	}
});
