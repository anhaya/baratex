<script lang="ts">
	import type { Listing } from '$lib/api/schemas';
	import { formatBRL } from '$lib/utils/format';
	import Photo from './Photo.svelte';

	let { listing }: { listing: Listing } = $props();
</script>

<a class="tile" href="/anuncio/{listing.id}">
	<span class="img">
		<Photo photo={listing.photos[0]} size={240} />
		<span class="price">{formatBRL(listing.price)}</span>
	</span>
	<span class="name">{listing.title}</span>
</a>

<style>
	.tile {
		display: grid;
		gap: 10px;
	}
	.img {
		position: relative;
		display: block;
		aspect-ratio: 1;
		border-radius: var(--radius-l);
		overflow: hidden;
		background: var(--placeholder);
	}
	.price {
		position: absolute;
		left: 10px;
		bottom: 10px;
		padding: 4px 10px;
		border-radius: var(--pill);
		background: var(--white);
		font-weight: 800;
		font-size: 14px;
	}
	.name {
		font-weight: 600;
		font-size: 14px;
	}
	.tile:hover .name {
		text-decoration: underline;
	}
</style>
