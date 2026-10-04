<script lang="ts">
	import type { ListingWithSeller } from '$lib/api/types';
	import { formatBRL, formatKm } from '$lib/utils/format';
	import FavoriteButton from './FavoriteButton.svelte';
	import Photo from './Photo.svelte';

	let { item }: { item: ListingWithSeller } = $props();

	const listing = $derived(item.listing);
</script>

<article class="tile" aria-labelledby="ft-{listing.id}">
	<a class="img" href="/anuncio/{listing.id}" tabindex="-1" aria-hidden="true">
		<Photo photo={listing.photos[0]} size={320} />
	</a>
	<span class="fav"><FavoriteButton listingId={listing.id} favorite={item.favorite} title={listing.title} /></span>
	<a class="body" href="/anuncio/{listing.id}">
		<span class="price display">{formatBRL(listing.price)}</span>
		<h2 class="name" id="ft-{listing.id}">{listing.title}</h2>
		<span class="meta">{listing.neighborhood} · {formatKm(listing.distanceKm)}</span>
	</a>
</article>

<style>
	.tile {
		position: relative;
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	.img {
		display: block;
		aspect-ratio: 1;
		border-radius: var(--radius-m);
		overflow: hidden;
		border: 1.5px solid var(--line);
		background: var(--white);
	}
	.img :global(img) {
		transition: transform 0.2s;
	}
	.tile:hover .img :global(img) {
		transform: scale(1.03);
	}
	.fav {
		position: absolute;
		top: 10px;
		right: 10px;
	}
	.body {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.price {
		font-size: 18px;
	}
	.name {
		font-weight: 600;
		font-size: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		font-size: 12px;
		color: var(--muted);
	}
	.tile:hover .name {
		text-decoration: underline;
	}
</style>
