<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { Comment, User } from '$lib/api/schemas';
	import type { ListingWithSeller } from '$lib/api/types';
	import { stayOnPage } from '$lib/forms';
	import { formatKm, rating, timeAgo } from '$lib/utils/format';
	import Avatar from './Avatar.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import Icon from './Icon.svelte';
	import OfferDialog from './OfferDialog.svelte';
	import Photo from './Photo.svelte';
	import PriceTag from './PriceTag.svelte';

	interface Props {
		item: ListingWithSeller;
		people: Record<string, User>;
		viewer: User;
		eager?: boolean;
	}
	let { item, people, viewer, eager = false }: Props = $props();

	const listing = $derived(item.listing);
	const seller = $derived(item.seller);
	const href = $derived(`/anuncio/${listing.id}`);
	const shownComments = $derived(listing.comments.slice(0, 2));
	const extraPhotos = $derived(Math.max(0, listing.photos.length - 3));

	let slide = $state(0);
	let offerOpen = $state(false);
	let commentError = $state('');

	function onscroll(event: Event) {
		const el = event.currentTarget as HTMLElement;
		slide = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
	}

	const author = (c: Comment) => people[c.authorId]?.name ?? 'Alguém';
</script>

<article class="post card" aria-labelledby="t-{listing.id}">
	<header class="head">
		<Avatar name={seller.name} />
		<div class="who">
			<strong>{seller.name}</strong>
			<span class="meta">
				{timeAgo(listing.postedAt)}<span class="desk"> · {listing.neighborhood}</span>, {formatKm(listing.distanceKm)} · {rating(seller.rating)}<span class="desk"
					>{seller.salesCount >= 50 ? ` · ${seller.salesCount} vendas` : ''}</span
				>
			</span>
		</div>
		<div class="head-actions">
			<button type="button" class="icon-btn offer" aria-label="Fazer oferta em “{listing.title}”" title="Fazer oferta" onclick={() => (offerOpen = true)}>
				<Icon name="cart" size={18} />
			</button>
			<FavoriteButton listingId={listing.id} favorite={item.favorite} title={listing.title} />
		</div>
	</header>

	<div class="media">
		<div class="gallery" {onscroll} class:single={listing.photos.length === 1}>
			{#each listing.photos as photo, i (i)}
				<a {href} class="frame" class:main={i === 0} class:hidden-desk={i > 2} tabindex={i === 0 ? 0 : -1} aria-label={i === 0 ? `Ver ${listing.title}` : undefined}>
					<Photo {photo} eager={eager && i === 0} />
					{#if i === 2 && extraPhotos > 0}
						<span class="more desk">+{extraPhotos} {extraPhotos === 1 ? 'foto' : 'fotos'}</span>
					{/if}
				</a>
			{/each}
		</div>
		<div class="tag"><PriceTag price={listing.price} /></div>
		{#if listing.photos.length > 1}
			<div class="dots mob" aria-hidden="true">
				{#each listing.photos as _, i (i)}<span class:on={i === slide}></span>{/each}
			</div>
			<span class="counter mob" aria-hidden="true">{slide + 1}/{listing.photos.length}</span>
		{/if}
	</div>

	<div class="body">
		<h2 id="t-{listing.id}" class="display title"><a {href}>{listing.title}</a></h2>
	</div>

	<div class="actions">
		<a href="{href}#comentarios" class="comments-count" aria-label="{listing.comments.length} comentários">
			<Icon name="chat" size={20} />{listing.comments.length}
		</a>
	</div>

	{#if listing.comments.length > 0}
		<section class="comments" aria-label="Comentários">
			{#if listing.comments.length > 2}
				<a href="{href}#comentarios" class="see-all desk">Ver todos os {listing.comments.length} comentários</a>
			{/if}
			<ul>
				{#each shownComments as c (c.id)}
					<li class:reply={!!c.replyTo}>
						<span class="desk"><Avatar name={author(c)} size="s" tone="soft" /></span>
						<div>
							<div class="bubble">
								<strong>{author(c)}</strong>
								{#if c.authorId === seller.id}<span class="badge">Vendedor(a)</span>{/if}
								<span class="text">{c.text}</span>
							</div>
							<span class="when desk">{timeAgo(c.createdAt)} · <a href="{href}#comentarios">Responder</a></span>
						</div>
					</li>
				{/each}
			</ul>
			{#if listing.comments.length > 2}
				<a href="{href}#comentarios" class="see-all mob">Ver os {listing.comments.length} comentários</a>
			{/if}
		</section>
	{/if}

	<form
		class="add-comment desk"
		method="POST"
		action="{href}?/comment"
		use:enhance={stayOnPage({ after: (ok) => (commentError = ok ? '' : 'Não foi possível comentar') })}
	>
		<input type="hidden" name="back" value={page.url.pathname + page.url.search} />
		<Avatar name={viewer.name} size="s" tone="accent" />
		<label class="visually-hidden" for="comment-{listing.id}">Escreva um comentário</label>
		<input id="comment-{listing.id}" name="text" class="field" placeholder="Escreva um comentário…" maxlength="500" required autocomplete="off" />
		{#if commentError}<span class="error-text" role="alert">{commentError}</span>{/if}
	</form>
</article>

<OfferDialog bind:open={offerOpen} listingId={listing.id} title={listing.title} price={listing.price} />

<style>
	.post {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 18px 12px;
	}
	.head-actions {
		display: flex;
		gap: 8px;
	}
	.offer {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--white);
	}
	.offer:hover {
		background: var(--accent-ink);
		border-color: var(--accent-ink);
	}
	.who {
		flex: 1;
		display: grid;
		min-width: 0;
	}
	.who strong {
		font-size: 15px;
	}
	.meta {
		font-size: 13px;
		color: var(--muted);
	}
	.media {
		position: relative;
		padding: 0 4px;
	}
	.gallery {
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 4px;
		height: 340px;
	}
	.gallery.single {
		grid-template-columns: 1fr;
	}
	.frame {
		position: relative;
		overflow: hidden;
		border-radius: 14px;
		background: var(--white);
	}
	.frame.main {
		grid-row: span 2;
	}
	.hidden-desk {
		display: none;
	}
	.more {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: rgba(14, 14, 16, 0.55);
		color: var(--white);
		font-weight: 800;
	}
	.tag {
		position: absolute;
		top: 14px;
		left: calc(66% - 150px);
		pointer-events: none;
	}
	.body {
		display: grid;
		gap: 12px;
		flex: 1;
		padding: 16px 18px;
	}
	.title {
		font-size: 22px;
		line-height: 1.2;
	}
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 18px;
		border-top: 1.5px solid var(--line);
	}
	.comments-count {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-weight: 800;
	}
	.comments {
		display: grid;
		gap: 10px;
		padding: 14px 18px 4px;
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
		align-items: flex-start;
	}
	.comments li.reply {
		margin-left: 38px;
	}
	.bubble {
		display: grid;
		gap: 2px;
		padding: 10px 14px;
		border-radius: 14px;
		background: var(--surface);
		font-size: 14px;
	}
	.bubble .badge {
		justify-self: start;
	}
	.bubble strong {
		font-size: 14px;
	}
	.when {
		display: block;
		margin: 4px 0 0 12px;
		font-size: 12px;
		color: var(--muted);
	}
	.when a {
		color: var(--ink);
		font-weight: 700;
	}
	.see-all {
		font-size: 13px;
		font-weight: 700;
		color: var(--muted);
	}
	.add-comment {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 18px 18px;
	}
	.add-comment .field {
		min-height: 40px;
		border-radius: var(--pill);
		background: var(--surface-2);
	}
	.mob {
		display: none;
	}

	/* Desktop feed is a grid of equal-height cards: comments live on the listing page. */
	@media (min-width: 1024px) {
		.comments,
		.add-comment {
			display: none;
		}
	}

	@media (max-width: 1023px) {
		.post {
			border-radius: var(--radius-l);
		}
		.desk,
		.add-comment {
			display: none;
		}
		.mob {
			display: block;
		}
		.head {
			padding: 12px 14px 10px;
		}
		.media {
			margin: 0 4px;
			border: 1.5px solid var(--line);
			border-radius: 18px;
			overflow: hidden;
			padding: 0;
		}
		.gallery {
			display: flex;
			height: auto;
			aspect-ratio: 1 / 0.7;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			scrollbar-width: none;
		}
		.gallery::-webkit-scrollbar {
			display: none;
		}
		.frame {
			flex: 0 0 100%;
			scroll-snap-align: start;
			border-radius: 0;
		}
		.hidden-desk {
			display: block;
		}
		.tag {
			left: auto;
			right: 14px;
			top: 10px;
		}
		.tag :global(.tag) {
			font-size: 17px;
		}
		.dots {
			position: absolute;
			bottom: 14px;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			gap: 4px;
		}
		.dots span {
			width: 6px;
			height: 6px;
			border-radius: var(--pill);
			background: var(--line-2);
		}
		.dots span.on {
			width: 18px;
			background: var(--ink);
		}
		.counter {
			position: absolute;
			right: 12px;
			bottom: 10px;
			padding: 4px 8px;
			border-radius: var(--pill);
			background: rgba(14, 14, 16, 0.78);
			color: var(--white);
			font-size: 11px;
			font-weight: 800;
		}
		.body {
			gap: 6px;
			padding: 12px 14px 6px;
		}
		.title {
			font-size: 18px;
		}
		.actions {
			gap: 16px;
			border-top: 0;
			padding: 6px 14px 12px;
		}
		.comments {
			margin: 0 14px;
			padding: 10px 0 14px;
			border-top: 1.5px solid var(--line);
			gap: 6px;
		}
		.comments ul {
			gap: 6px;
		}
		.comments li.reply {
			margin-left: 0;
		}
		.bubble {
			display: block;
			padding: 0;
			background: none;
		}
		.bubble .text {
			margin-left: 4px;
		}
	}
</style>
