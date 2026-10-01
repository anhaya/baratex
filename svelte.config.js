import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({ precompress: true }),
		// Strict Content Security Policy. SvelteKit adds a nonce (SSR) or hash
		// (prerender) to its own inline bootstrap script, so no 'unsafe-inline'
		// is needed for scripts. The app never uses inline style attributes,
		// so styles are locked to same-origin as well.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self'],
				// The only inline style allowed is the one on SvelteKit's own
				// route announcer (screen-reader live region), pinned by hash.
				'style-src-attr': ['unsafe-hashes', 'sha256-S8qMpvofolR8Mpjy4kQvEm7m1q8clzU4dfDH0AmvZjo='],
				'img-src': ['self', 'blob:'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'media-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'frame-src': ['none'],
				'worker-src': ['self'],
				'manifest-src': ['self']
			}
		},
		// Rejects cross-site form submissions (CSRF). This is the default; it
		// is spelled out so nobody turns it off by accident.
		csrf: {
			trustedOrigins: []
		},
		alias: {
			$api: 'src/lib/api'
		}
	}
};

export default config;
