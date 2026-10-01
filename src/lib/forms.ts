import type { SubmitFunction } from '@sveltejs/kit';

/**
 * `use:enhance` handler for forms that act in place (favorite, comment).
 * Without JavaScript the form posts a `back` path and the server redirects
 * there; with JavaScript we drop it so the page just refreshes its data
 * without jumping to the top.
 */
export function stayOnPage(opts: { before?: () => void; after?: (ok: boolean) => void } = {}): SubmitFunction {
	return ({ formData }) => {
		formData.delete('back');
		opts.before?.();
		return async ({ result, update }) => {
			await update({ reset: result.type === 'success', invalidateAll: true });
			opts.after?.(result.type === 'success');
		};
	};
}
