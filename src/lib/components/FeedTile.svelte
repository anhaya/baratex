<script lang="ts">
	import type { User } from '$lib/api/schemas';
	import type { ListingWithSeller } from '$lib/api/types';
	import { formatBRL, formatKm } from '$lib/utils/format';
	import CommentsSheet from './CommentsSheet.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import Icon from './Icon.svelte';
	import Photo from './Photo.svelte';

	let { item, people, viewer }: { item: ListingWithSeller; people: Record<string, User>; viewer: User } = $props();
	let commentsOpen = $state(false);

	const listing = $derived(item.listing);
	const latest = $derived(listing.comments.reduce<(typeof listing.comments)[number] | undefined>((a, c) => (!a || c.createdAt > a.createdAt ? c : a), undefined));
	const latestAuthor = $derived(latest ? (latest.authorId === item.seller.id ? 'Vendedor(a)' : (people[latest.authorId]?.name ?? 'Alguém')) : '');
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
	<button type="button" class="talk" aria-haspopup="dialog" onclick={() => (commentsOpen = true)}>
		<Icon name="chat" size={14} />
		{#if latest}
			<span class="count">{listing.comments.length}</span>
			<span class="last"><strong>{latestAuthor}:</strong> {latest.text}</span>
		{:else}
			<span class="last">Seja o primeiro a comentar</span>
		{/if}
	</button>
</article>

<CommentsSheet bind:open={commentsOpen} {item} {people} {viewer} />

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
	.talk {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		width: 100%;
		padding: 7px 10px;
		border: 0;
		text-align: left;
		font: inherit;
		cursor: pointer;
		border-radius: var(--radius-s);
		background: var(--surface);
		font-size: 12px;
		color: var(--ink-3);
	}
	.talk:hover {
		background: var(--accent-softer);
	}
	.talk :global(svg) {
		flex: none;
	}
	.count {
		font-weight: 800;
		color: var(--ink);
	}
	.last {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.last strong {
		color: var(--ink);
	}
	.tile:hover .name {
		text-decoration: underline;
	}
</style>
