<script lang="ts">
	import { enhance } from '$app/forms';
	import Photo from '$lib/components/Photo.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { formatBRL } from '$lib/utils/format';
	import { protectionFee } from '$lib/utils/pricing';

	let { data, form } = $props();

	const lines = $derived(
		data.items.map(({ item, listing, seller }) => {
			const shipping = item.delivery === 'entrega' ? (listing.shipping.deliveryPrice ?? 0) : 0;
			const fee = protectionFee(listing.price);
			return { item, listing, seller, shipping, fee, total: listing.price + shipping + fee };
		})
	);
	const grand = $derived(lines.reduce((n, l) => n + l.total, 0));
</script>

<svelte:head><title>baratex · Minha sacola</title></svelte:head>

<main class="page">
	<h1 class="display">Minha sacola</h1>
	{#if lines.length === 0}
		<div class="empty card">
			<p>Sua sacola está vazia.</p>
			<a class="btn btn-primary" href="/">Ver o feed</a>
		</div>
	{:else}
		<ul class="lines">
			{#each lines as l (l.listing.id)}
				<li class="line card">
					<span class="thumb"><Photo photo={l.listing.photos[0]} size={80} /></span>
					<div class="body">
						<a href="/anuncio/{l.listing.id}"><strong>{l.listing.title}</strong></a>
						<span class="muted">{l.seller.name} · {l.item.delivery === 'entrega' ? `Entrega ${formatBRL(l.shipping)}` : 'Retirada grátis'} · proteção {formatBRL(l.fee)}</span>
					</div>
					<strong class="display">{formatBRL(l.total)}</strong>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="listingId" value={l.listing.id} />
						<button class="icon-btn" aria-label="Remover {l.listing.title}"><Icon name="close" size={16} /></button>
					</form>
				</li>
			{/each}
		</ul>
		<div class="summary card">
			<span>Total</span>
			<strong class="display">{formatBRL(grand)}</strong>
			<form method="POST" action="?/checkout" use:enhance>
				<button class="btn btn-primary btn-lg btn-block">Pagar com proteção</button>
			</form>
			{#if form && 'checkout' in form}
				<p class="muted" role="status">Pagamento ainda é simulado. Quando o backend existir, o dinheiro fica guardado até você confirmar o recebimento.</p>
			{/if}
		</div>
	{/if}
</main>

<style>
	.page {
		display: grid;
		gap: 20px;
		max-width: 760px;
	}
	h1 {
		font-size: 30px;
	}
	.empty {
		display: grid;
		justify-items: start;
		gap: 12px;
		padding: 24px;
	}
	.lines {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.line {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px;
		border-radius: var(--radius-l);
	}
	.thumb {
		flex: none;
		width: 72px;
		height: 72px;
		border-radius: 14px;
		overflow: hidden;
		border: 1.5px solid var(--line);
	}
	.body {
		flex: 1;
		display: grid;
		gap: 2px;
		font-size: 13px;
		min-width: 0;
	}
	.body strong {
		font-size: 15px;
	}
	.summary {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 14px;
		padding: 20px;
		align-items: center;
	}
	.summary strong {
		font-size: 24px;
	}
	.summary form,
	.summary p {
		grid-column: 1 / -1;
	}
	@media (max-width: 1023px) {
		.page {
			padding: 8px 12px;
		}
		h1 {
			font-size: 24px;
		}
	}
</style>
