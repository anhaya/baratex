<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ListingTile from '$lib/components/ListingTile.svelte';
	import OfferDialog from '$lib/components/OfferDialog.svelte';
	import Photo from '$lib/components/Photo.svelte';
	import { stayOnPage } from '$lib/forms';
	import { formatBRL, formatKm, rating, timeAgo } from '$lib/utils/format';
	import { buyerTotal, fairPosition, protectionFee } from '$lib/utils/pricing';

	let { data } = $props();

	// Going back with history keeps the feed's filters and scroll position;
	// a direct visit has nothing to go back to, so the link falls back to "/".
	let cameFromApp = $state(false);
	afterNavigate(({ from }) => {
		if (from) cameFromApp = true;
	});
	function goBack(event: MouseEvent) {
		if (!cameFromApp) return;
		event.preventDefault();
		history.back();
	}

	const listing = $derived(data.detail.listing);
	const seller = $derived(data.detail.seller);
	const sold = $derived(listing.status === 'sold');
	const canDeliver = $derived(listing.shipping.deliveryPrice !== null);
	const canPickup = $derived(listing.shipping.pickupSpotKm !== null);

	let current = $state(0);
	let delivery = $derived<'entrega' | 'retirar'>(canDeliver ? 'entrega' : 'retirar');
	let offerOpen = $state(false);
	let following = $state(false);
	let shared = $state('');
	let replyTo = $state<string | null>(null);
	let commentError = $state('');

	const total = $derived(buyerTotal(listing.price, delivery === 'entrega' ? listing.shipping.deliveryPrice : 0));
	const fair = $derived.by(() => {
		if (!listing.fairPrice) return null;
		const pos = fairPosition(listing.price, listing.fairPrice);
		const label = pos < 0.25 ? 'Bom preço' : pos <= 0.7 ? 'Preço justo' : 'Acima da média';
		const avg = Math.round((listing.fairPrice.min + listing.fairPrice.max) / 2);
		const diff = Math.round(((listing.price - avg) / avg) * 100);
		const vsAvg = Math.abs(diff) < 5 ? 'Na média' : diff < 0 ? `${-diff}% abaixo da média` : `${diff}% acima da média`;
		return { pos, label, avg, diff, vsAvg, ...listing.fairPrice };
	});
	const author = (id: string) => data.detail.people[id]?.name ?? 'Alguém';

	async function share() {
		const url = page.url.href;
		try {
			if (navigator.share) {
				await navigator.share({ title: listing.title, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			shared = 'Link copiado';
		} catch {
			shared = '';
		}
	}
</script>

<svelte:head>
	<title>{listing.title} · {formatBRL(listing.price)} · baratex</title>
	<meta name="description" content="{listing.title} por {formatBRL(listing.price)} em {listing.neighborhood}. {listing.description.slice(0, 120)}" />
</svelte:head>

<main class="page">
	<nav class="back-bar" aria-label="Navegação">
		<a href="/" class="back" onclick={goBack}><Icon name="arrow-left" size={18} />Voltar ao feed</a>
	</nav>
	<div class="top-grid">
		<section class="gallery" aria-label="Fotos">
			<div class="main card">
				<Photo photo={listing.photos[current]} eager dim={sold} />
				{#if listing.photos[current]?.note}<span class="note">{listing.photos[current]?.note}</span>{/if}
				<span class="counter">{current + 1} / {listing.photos.length}</span>
			</div>
			{#if listing.photos.length > 1}
				<div class="thumbs">
					{#each listing.photos as photo, i (i)}
						{#if i !== current}
							<button type="button" class="thumb card" onclick={() => (current = i)} aria-label="Ver foto {i + 1}: {photo.alt}">
								<Photo {photo} size={240} />
								{#if photo.note}<span class="note">{photo.note}</span>{/if}
							</button>
						{/if}
					{/each}
				</div>
			{/if}
		</section>

		<div class="info">
			<section class="seller card" aria-label="Vendedor">
				<Avatar name={seller.name} size="l" tone="soft" />
				<div class="who">
					<strong>@{seller.handle}</strong>
					<span class="muted">{rating(seller.rating)} · {seller.salesCount} vendas · responde em {seller.responseTime}</span>
				</div>
				<button type="button" class="btn btn-outline btn-sm" aria-pressed={following} onclick={() => (following = !following)}>
					{following ? 'Seguindo' : 'Seguir'}
				</button>
			</section>

			<section class="buy card" aria-labelledby="title">
				<h1 id="title" class="display">{listing.title}</h1>

				<div class="price-row">
					<p class="price display">{formatBRL(listing.price)}</p>
					{#if sold}
						<span class="pill dark">Vendido</span>
					{:else if fair}
						<span class="pill dark">{fair.label}</span>
					{/if}
				</div>

				{#if fair}
					<dl class="fair">
						<div class="avg">
							<dt>Preço médio de vendas parecidas</dt>
							<dd class="display">{formatBRL(fair.avg)}</dd>
							<dd class="range">De {formatBRL(fair.min)} a {formatBRL(fair.max)} · últimos 90 dias</dd>
						</div>
						<div class="cmp" class:below={fair.diff <= -5} class:above={fair.diff >= 5}>
							<dt class="visually-hidden">Este anúncio</dt>
							<dd>{fair.vsAvg}</dd>
						</div>
					</dl>
				{/if}

				{#if !sold}
					<fieldset class="delivery">
						<legend class="visually-hidden">Como receber</legend>
						<label class="opt" class:on={delivery === 'entrega'} class:off={!canDeliver}>
							<input type="radio" name="delivery-choice" value="entrega" bind:group={delivery} disabled={!canDeliver} />
							<span>
								<strong>Entrega</strong>
								<small>
									{#if canDeliver}{formatBRL(listing.shipping.deliveryPrice ?? 0)}{listing.shipping.deliveryEta ? ` · ${listing.shipping.deliveryEta}` : ''}{:else}Indisponível{/if}
								</small>
							</span>
						</label>
						<label class="opt" class:on={delivery === 'retirar'} class:off={!canPickup}>
							<input type="radio" name="delivery-choice" value="retirar" bind:group={delivery} disabled={!canPickup} />
							<span>
								<strong>Retirar</strong>
								<small>{canPickup ? `Grátis · ponto seguro ${formatKm(listing.shipping.pickupSpotKm ?? 0)}` : 'Indisponível'}</small>
							</span>
						</label>
					</fieldset>

					<div class="total">
						<span class="muted">Total com frete e proteção</span>
						<strong class="display" title="Inclui proteção de {formatBRL(protectionFee(listing.price))}">{formatBRL(total)}</strong>
					</div>

					<div class="cta">
						<form method="POST" action="?/buy" use:enhance>
							<input type="hidden" name="delivery" value={delivery} />
							<button class="btn btn-primary btn-block btn-lg">Comprar agora</button>
						</form>
						<div class="row">
							{#if listing.acceptsOffers}
								<button type="button" class="btn btn-soft offer" onclick={() => (offerOpen = true)}>Fazer oferta</button>
							{/if}
							<FavoriteButton listingId={listing.id} favorite={data.detail.favorite} title={listing.title} icon="heart" size="l" />
							<button type="button" class="icon-btn share" aria-label="Compartilhar" onclick={share}><Icon name="share" size={20} /></button>
						</div>
						{#if shared}<p class="muted small" role="status">{shared}</p>{/if}
					</div>
					<p class="protect"><Icon name="shield" size={18} />Dinheiro guardado até você confirmar que recebeu. Veio diferente? Reembolso total.</p>
				{:else}
					<p class="muted">Esta peça já foi vendida. Que tal ver outras da vitrine de {seller.name}?</p>
				{/if}
			</section>

		</div>

		<section class="about card" aria-labelledby="about">
			<h2 id="about">Sobre a peça</h2>
			<p class="desc">{listing.description || 'O vendedor não escreveu uma descrição.'}</p>
			{#if listing.specs.length}
				<dl class="specs">
					{#each listing.specs as s (s.label)}
						<div><dt>{s.label}</dt><dd>{s.value}</dd></div>
					{/each}
				</dl>
			{/if}
		</section>

		<section id="comentarios" class="comments card" aria-labelledby="comments-title">
			<h2 id="comments-title">Comentários ({listing.comments.length})</h2>
			{#if listing.comments.length === 0}
				<p class="muted">Ninguém perguntou nada ainda. Seja o primeiro.</p>
			{/if}
			<ul>
				{#each listing.comments as c (c.id)}
					<li class:reply={!!c.replyTo}>
						<Avatar name={author(c.authorId)} size="s" tone="soft" />
						<div>
							<div class="bubble">
								<strong>{author(c.authorId)}</strong>
								{#if c.authorId === seller.id}<span class="badge">Vendedor(a)</span>{/if}
								<p>{c.text}</p>
							</div>
							<span class="when">{timeAgo(c.createdAt)} · <button type="button" class="link" onclick={() => (replyTo = c.id)}>Responder</button></span>
						</div>
					</li>
				{/each}
			</ul>
			<form
				method="POST"
				action="?/comment"
				class="add"
				use:enhance={stayOnPage({
					after: (ok) => {
						commentError = ok ? '' : 'Não foi possível comentar.';
						if (ok) replyTo = null;
					}
				})}
			>
				{#if replyTo}
					<input type="hidden" name="replyTo" value={replyTo} />
					<p class="replying">Respondendo {author(listing.comments.find((c) => c.id === replyTo)?.authorId ?? '')} · <button type="button" class="link" onclick={() => (replyTo = null)}>cancelar</button></p>
				{/if}
				<div class="add-row">
					<Avatar name={data.viewer.name} size="s" tone="accent" />
					<label class="visually-hidden" for="comment">Escreva um comentário</label>
					<input id="comment" name="text" class="field" placeholder="Escreva um comentário…" maxlength="500" required autocomplete="off" />
					<button class="btn btn-dark btn-sm">Enviar</button>
				</div>
				{#if commentError}<p class="error-text" role="alert">{commentError}</p>{/if}
			</form>
		</section>
	</div>


	{#if data.detail.moreFromSeller.length}
		<section class="more" aria-labelledby="more-title">
			<header>
				<h2 id="more-title" class="display">Mais da vitrine {seller.name.endsWith('a') ? 'da' : 'do'} {seller.name}</h2>
				<span class="link-u">Ver vitrine · {data.detail.sellerListingCount} peças</span>
			</header>
			<div class="tiles">
				{#each data.detail.moreFromSeller as l (l.id)}
					<ListingTile listing={l} />
				{/each}
			</div>
		</section>
	{/if}
</main>

{#if !sold}
	<div class="mobile-bar">
		<button type="button" class="btn btn-soft" onclick={() => (offerOpen = true)}>Fazer oferta</button>
		<form method="POST" action="?/buy" use:enhance>
			<input type="hidden" name="delivery" value={delivery} />
			<button class="btn btn-primary btn-block">Comprar · {formatBRL(total)}</button>
		</form>
	</div>
{/if}

<OfferDialog bind:open={offerOpen} listingId={listing.id} title={listing.title} price={listing.price} />

<style>
	.page {
		max-width: 1440px;
		margin: 0 auto;
		padding: 32px 48px 80px;
		display: grid;
		gap: 28px;
	}
	.top-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 400px;
		grid-template-areas:
			'gallery info'
			'about info'
			'comments info';
		grid-template-rows: auto auto 1fr;
		gap: 16px 28px;
		align-items: start;
	}
	.gallery {
		grid-area: gallery;
	}
	.info {
		grid-area: info;
		position: sticky;
		top: 16px;
	}
	.about {
		grid-area: about;
	}
	.comments {
		grid-area: comments;
	}
	.gallery {
		display: grid;
		gap: 12px;
	}
	.main {
		position: relative;
		aspect-ratio: 1.6;
		overflow: hidden;
		border-radius: var(--radius-l);
		padding: 16px;
	}
	.back-bar {
		margin-bottom: -16px;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 40px;
		padding: 0 16px 0 12px;
		border: 1.5px solid var(--line);
		border-radius: var(--pill);
		background: var(--white);
		font-size: 14px;
		font-weight: 700;
	}
	.back:hover {
		border-color: var(--ink);
	}
	.counter {
		position: absolute;
		right: 18px;
		bottom: 18px;
		padding: 6px 12px;
		border-radius: var(--pill);
		background: var(--ink);
		color: var(--white);
		font-weight: 800;
		font-size: 12px;
	}
	.note {
		position: absolute;
		left: 24px;
		bottom: 20px;
		font-size: 12px;
		font-weight: 700;
	}
	.thumbs {
		display: flex;
		gap: 8px;
	}
	.thumb {
		position: relative;
		flex: 0 0 76px;
		aspect-ratio: 1;
		overflow: hidden;
		padding: 4px;
		border-radius: var(--radius-s);
	}
	.thumb .note {
		display: none;
	}
	.thumb:hover {
		border-color: var(--ink);
	}
	.info {
		display: grid;
		gap: 12px;
	}
	.seller {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
	}
	.who {
		flex: 1;
		display: grid;
		font-size: 13px;
	}
	.who strong {
		font-size: 15px;
	}
	.buy {
		display: grid;
		gap: 12px;
		padding: 20px;
	}
	h1 {
		font-size: 22px;
		line-height: 1.15;
	}
	.price-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.price {
		font-size: 30px;
		line-height: 1;
	}
	.pill {
		padding: 6px 12px;
		border-radius: var(--pill);
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.dark {
		background: var(--ink);
		color: var(--white);
	}
	.fair {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin: 0;
		padding: 10px 14px;
		border-radius: var(--radius-s);
		background: var(--surface);
	}
	.fair dd {
		margin: 0;
	}
	.avg {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.avg dt {
		font-size: 12px;
		font-weight: 700;
		color: var(--muted);
	}
	.avg .display {
		font-size: 16px;
	}
	.range {
		font-size: 12px;
		color: var(--muted);
	}
	.cmp dd {
		padding: 6px 12px;
		border-radius: var(--pill);
		background: var(--white);
		font-size: 13px;
		font-weight: 800;
		white-space: nowrap;
	}
	.cmp.below dd {
		background: var(--accent-soft);
		color: var(--accent-ink);
	}
	.cmp.above dd {
		background: var(--ink);
		color: var(--white);
	}
	.delivery {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.opt {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 10px 12px;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-s);
		cursor: pointer;
	}
	.opt input {
		margin: 3px 0 0;
		accent-color: var(--ink);
		width: 18px;
		height: 18px;
	}
	.opt span {
		display: grid;
	}
	.opt small {
		font-size: 12px;
		color: var(--muted);
	}
	.opt.on {
		border: 2px solid var(--ink);
	}
	.opt.off {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.total {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.total strong {
		font-size: 18px;
	}
	.cta {
		display: grid;
		gap: 8px;
	}
	.row {
		display: flex;
		gap: 10px;
	}
	.offer {
		flex: 1;
		min-height: 44px;
	}
	.share {
		width: 44px;
		height: 44px;
	}
	.small {
		font-size: 13px;
	}
	.protect {
		display: flex;
		gap: 8px;
		font-size: 12px;
		color: var(--muted);
	}
	.protect :global(svg) {
		flex: none;
		color: var(--ink);
	}
	.about {
		display: grid;
		gap: 10px;
		padding: 18px 20px;
	}
	.about h2,
	.comments h2 {
		font-size: 15px;
		font-weight: 800;
	}
	.desc {
		font-size: 14px;
		color: var(--ink-3);
		white-space: pre-line;
	}
	.specs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px 16px;
		margin: 0;
		font-size: 13px;
	}
	.specs div {
		display: flex;
		gap: 4px;
	}
	.specs dt {
		color: var(--muted);
	}
	.specs dd {
		margin: 0;
		font-weight: 800;
	}
	.comments {
		display: grid;
		gap: 12px;
		padding: 18px 20px;
	}
	.comments ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.comments li {
		display: flex;
		gap: 10px;
	}
	.comments li.reply {
		margin-left: 38px;
	}
	.bubble {
		display: grid;
		gap: 2px;
		padding: 8px 12px;
		border-radius: 12px;
		background: var(--surface);
		font-size: 13px;
	}
	.bubble .badge {
		justify-self: start;
	}
	.when {
		display: block;
		margin: 4px 0 0 12px;
		font-size: 12px;
		color: var(--muted);
	}
	.link {
		padding: 0;
		border: 0;
		background: none;
		font-weight: 700;
		color: var(--ink);
		font-size: inherit;
	}
	.add {
		display: grid;
		gap: 6px;
	}
	.add-row {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.add .field {
		min-height: 40px;
		border-radius: var(--pill);
	}
	.replying {
		font-size: 13px;
		color: var(--muted);
	}
	.more {
		display: grid;
		gap: 14px;
	}
	.more header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
	}
	.more h2 {
		font-size: 20px;
	}
	.link-u {
		font-weight: 700;
		text-decoration: underline;
		font-size: 14px;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 16px;
	}
	.mobile-bar {
		display: none;
	}

	@media (max-width: 1279px) {
		.top-grid {
			grid-template-columns: minmax(0, 1fr) 360px;
		}
		.tiles {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (max-width: 1023px) {
		.page {
			padding: 0 0 calc(96px + env(safe-area-inset-bottom));
			gap: 24px;
		}
		.top-grid {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas: 'gallery' 'info' 'about' 'comments';
			grid-template-rows: none;
			gap: 14px;
		}
		.info {
			position: static;
		}
		.main {
			border-radius: 0 0 28px 28px;
			border-top: 0;
		}
		.back-bar {
			position: sticky;
			top: 0;
			z-index: 5;
			margin-bottom: -24px;
			padding: 8px 12px;
			background: var(--white);
			border-bottom: 1.5px solid var(--line);
		}
		.back {
			border: 0;
			padding-left: 4px;
		}
		.thumbs {
			display: flex;
			overflow-x: auto;
			padding: 0 12px;
			gap: 8px;
		}
		.thumb {
			flex: 0 0 72px;
		}
		.info,
		.more {
			padding-left: 12px;
			padding-right: 12px;
		}
		.about,
		.comments {
			margin: 0 12px;
			padding: 18px;
		}
		.buy {
			padding: 20px;
		}
		.buy .cta,
		.buy .protect {
			display: none;
		}
		h1 {
			font-size: 20px;
		}
		.price {
			font-size: 28px;
		}
		.tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.more h2 {
			font-size: 20px;
		}
		.mobile-bar {
			position: fixed;
			inset: auto 0 0 0;
			z-index: 30;
			display: grid;
			grid-template-columns: auto 1fr;
			gap: 10px;
			padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
			background: var(--white);
			border-top: 1.5px solid var(--line);
		}
	}
</style>
