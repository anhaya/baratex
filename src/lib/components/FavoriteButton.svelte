<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { stayOnPage } from '$lib/forms';
	import Icon from './Icon.svelte';

	interface Props {
		listingId: string;
		favorite: boolean;
		title: string;
		icon?: 'star' | 'heart';
		size?: 'm' | 'l';
	}
	let { listingId, favorite, title, icon = 'star', size = 'm' }: Props = $props();

	// Optimistic: flips immediately, then follows the server's answer.
	let pressed = $derived(favorite);
</script>

<form
	method="POST"
	action="/anuncio/{listingId}?/favorite"
	use:enhance={stayOnPage({ before: () => (pressed = !pressed) })}
>
	<input type="hidden" name="back" value={page.url.pathname + page.url.search} />
	<button
		class="icon-btn {size}"
		aria-pressed={pressed}
		aria-label={pressed ? `Remover “${title}” dos favoritos` : `Salvar “${title}” nos favoritos`}
	>
		<Icon name={icon} size={size === 'l' ? 20 : 18} filled={pressed} />
	</button>
</form>

<style>
	.l {
		width: 48px;
		height: 48px;
	}
</style>
