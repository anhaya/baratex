<script lang="ts">
	import type { FavoriteItem } from '$lib/api/types';
	import { formatBRL, formatKm } from '$lib/utils/format';
	import FavoriteButton from './FavoriteButton.svelte';
	import OfferDialog from './OfferDialog.svelte';
	import Photo from './Photo.svelte';

	let { item }: { item: FavoriteItem } = $props();
	const { listing, seller } = $derived(item);
	const sold = $derived(listing.status === 'sold');
	let offerOpen = $state(false);

	const badge = $derived.by(() => {
		const b = item.favorite.badge;
		switch (b.kind) {
			case 'offer_sent':
				return { text: `Oferta enviada · ${formatBRL(b.amount)}`, tone: 'dark' };
			case 'price_drop':
				return { text: `Baixou ${formatBRL(b.amount)}`, tone: 'accent' };
			case 'new_tag':
				return { text: 'Novo com etiqueta', tone: 'light' };
			case 'new_comments':
				return { text: `${b.count} ${b.count === 1 ? 'novo comentário' : 'novos comentários'}`, tone: 'light' };
			case 'sold':
				return { text: 'Vendido', tone: 'muted' };
			default:
				return { text: 'Disponível', tone: 'light' };
		}
	});
</script>

<article class="fav card" class:sold>
	<a class="img" href="/anuncio/{listing.id}" tabindex="-1" aria-hidden="true">
		<Photo photo={listing.photos[0]} size={240} dim={sold} />
	</a>
	<span class="badge-pill {badge.tone}">{badge.text}</span>
	<div class="info">
		<div>
			<p class="price display">{formatBRL(listing.price)}</p>
			<h2><a href="/anuncio/{listing.id}">{listing.title}</a></h2>
			<p class="muted meta">{seller.name} · {formatKm(listing.distanceKm)}</p>
		</div>
		<FavoriteButton listingId={listing.id} favorite={true} title={listing.title} />
	</div>
	{#if sold}
		<button class="btn btn-ghost btn-block" disabled>Vendido</button>
	{:else}
		<button type="button" class="btn btn-primary btn-block" onclick={() => (offerOpen = true)}>Fazer oferta</button>
	{/if}
</article>

{#if !sold}
	<OfferDialog bind:open={offerOpen} listingId={listing.id} title={listing.title} price={listing.price} />
{/if}

<style>
	.fav {
		position: relative;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 12px;
		padding: 10px 10px 14px;
	}
	.img {
		display: block;
		aspect-ratio: 1.22;
		overflow: hidden;
		border-radius: var(--radius-m);
		border: 1.5px solid var(--line);
	}
	.badge-pill {
		position: absolute;
		top: 22px;
		left: 22px;
		padding: 4px 10px;
		border-radius: var(--pill);
		font-size: 11px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	.dark {
		background: var(--ink);
		color: var(--white);
	}
	.accent {
		background: var(--accent-soft);
		color: var(--accent-ink);
	}
	.light {
		background: var(--white);
		border: 1px solid var(--line);
	}
	.muted {
		color: var(--muted);
	}
	.badge-pill.muted {
		background: var(--surface);
	}
	.info {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		padding: 0 4px;
	}
	.price {
		font-size: 20px;
	}
	h2 {
		font-size: 14px;
		font-weight: 700;
	}
	.meta {
		font-size: 12px;
		margin-top: 2px;
	}
	.sold .price,
	.sold h2 {
		color: var(--muted);
	}
	.btn {
		min-height: 40px;
		font-size: 14px;
	}
</style>
