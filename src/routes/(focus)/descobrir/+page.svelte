<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { untrack } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import OfferDialog from '$lib/components/OfferDialog.svelte';
	import Photo from '$lib/components/Photo.svelte';
	import { formatBRL } from '$lib/utils/format';

	let { data } = $props();

	// The deck is consumed locally; saves are sent to the server as they happen.
	let deck = $state(untrack(() => [...data.deck]));
	let index = $state(0);
	let dragX = $state(0);
	let dragging = $state(false);
	let leaving = $state<'left' | 'right' | null>(null);
	let offerOpen = $state(false);
	let saved = $state(0);
	let startX = 0;
	let moved = false;

	const current = $derived(deck[index]);
	const next = $derived(deck.slice(index + 1, index + 3));
	const THRESHOLD = 90;

	async function save(listingId: string) {
		const res = await fetch(`/anuncio/${listingId}?/favorite`, {
			method: 'POST',
			body: new FormData(),
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await res.text());
		if (result.type === 'success') {
			saved += 1;
			invalidate('app:counts');
		}
	}

	function decide(direction: 'left' | 'right') {
		if (!current || leaving) return;
		leaving = direction;
		if (direction === 'right') save(current.listing.id);
		setTimeout(() => {
			index += 1;
			leaving = null;
			dragX = 0;
		}, 220);
	}

	function down(e: PointerEvent) {
		dragging = true;
		moved = false;
		startX = e.clientX;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function move(e: PointerEvent) {
		if (!dragging) return;
		dragX = e.clientX - startX;
		if (Math.abs(dragX) > 6) moved = true;
	}
	function up() {
		if (!dragging) return;
		dragging = false;
		if (dragX > THRESHOLD) decide('right');
		else if (dragX < -THRESHOLD) decide('left');
		else dragX = 0;
	}
	function onclick(e: MouseEvent) {
		// A drag is not a tap.
		if (moved) e.preventDefault();
	}
	function onkeydown(e: KeyboardEvent) {
		if (offerOpen) return;
		if (e.key === 'ArrowRight') decide('right');
		if (e.key === 'ArrowLeft') decide('left');
	}

	const offset = $derived(leaving === 'right' ? 600 : leaving === 'left' ? -600 : dragX);
	// Steps keep the transform in a class instead of an inline style (blocked by our CSP).
	const tilt = $derived(Math.max(-6, Math.min(6, Math.round(offset / 40))));
	const shift = $derived(Math.max(-15, Math.min(15, Math.round(offset / 40))));
</script>

<svelte:window {onkeydown} />
<svelte:head><title>baratex · Modo descobrir</title></svelte:head>

<main class="discover">
	<header>
		<a href="/" class="close" aria-label="Sair do modo descobrir"><Icon name="close" size={24} /></a>
		<h1 class="display">Modo descobrir</h1>
		<span class="theme">Moda vintage <Icon name="chevron-down" size={14} /></span>
	</header>

	<div class="stage" aria-live="polite">
		{#if current}
			{#each [...next].reverse() as n, i (n.listing.id)}
				<div class="ghost g{next.length - i}" aria-hidden="true"></div>
			{/each}
			{#key current.listing.id}
				<a
					href="/anuncio/{current.listing.id}"
					class="card-top tilt{tilt} shift{shift}"
					class:dragging
					class:leaving
					onpointerdown={down}
					onpointermove={move}
					onpointerup={up}
					onpointercancel={up}
					{onclick}
					draggable="false"
					aria-label="{current.listing.title}, {formatBRL(current.listing.price)}. Toque para ver detalhes"
				>
					<div class="bars" aria-hidden="true">
						{#each current.listing.photos as _, i (i)}<span class:on={i === 0}></span>{/each}
						{#if current.listing.photos.length < 4}{#each Array(4 - current.listing.photos.length) as _, i (i)}<span></span>{/each}{/if}
					</div>
					<span class="save-hint" class:show={offset > 30}>Salvar</span>
					<span class="pass-hint" class:show={offset < -30}>Passar</span>
					<div class="photo"><Photo photo={current.listing.photos[0]} eager /></div>
					<div class="panel">
						<div class="row">
							<strong class="price display">{formatBRL(current.listing.price)}</strong>
							{#if current.listing.tags[0]}<span class="muted">{current.listing.tags[0]}</span>{/if}
						</div>
						<p class="title">{current.listing.title}</p>
						<p class="muted meta">
							<span class="dot" aria-hidden="true"></span>{current.seller.handle}
							{#if current.listing.shipping.deliveryPrice !== null} · frete {formatBRL(current.listing.shipping.deliveryPrice)}{/if}
							{#if current.listing.shipping.deliveryEta} · {current.listing.shipping.deliveryEta.replace(/, .*/, '')}{/if}
						</p>
					</div>
				</a>
			{/key}
		{:else}
			<div class="done">
				<h2 class="display">Você viu tudo por hoje</h2>
				<p>{saved > 0 ? `${saved} ${saved === 1 ? 'peça salva' : 'peças salvas'} nos favoritos.` : 'Volte mais tarde para novidades.'}</p>
				<a class="btn btn-soft" href="/favoritos">Ver favoritos</a>
			</div>
		{/if}
	</div>

	{#if current}
		<div class="controls">
			<button type="button" class="round pass" aria-label="Passar" onclick={() => decide('left')}><Icon name="close" size={24} /></button>
			<button type="button" class="btn offer" onclick={() => (offerOpen = true)}>Fazer oferta</button>
			<button type="button" class="round like" aria-label="Salvar nos favoritos" onclick={() => decide('right')}><Icon name="heart" size={24} filled /></button>
		</div>
		<p class="help">Direita salva · esquerda passa · toque para ver detalhes</p>
		<OfferDialog bind:open={offerOpen} listingId={current.listing.id} title={current.listing.title} price={current.listing.price} />
	{/if}
</main>

<style>
	:global(body:has(.discover)) {
		background: var(--ink);
	}
	.discover {
		display: grid;
		grid-template-rows: auto 1fr auto auto;
		min-height: 100dvh;
		max-width: 480px;
		margin: 0 auto;
		padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
		color: var(--white);
		background: var(--ink);
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	h1 {
		flex: 1;
		font-size: 18px;
		white-space: nowrap;
	}
	.close {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
	}
	.theme {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1.5px solid var(--ink-3);
		border-radius: var(--pill);
		font-size: 13px;
		font-weight: 700;
	}
	.stage {
		position: relative;
		display: grid;
		place-items: center;
		margin: 20px 0;
		min-height: 520px;
	}
	.ghost,
	.card-top {
		position: absolute;
		inset: 10px 0 30px;
		border-radius: 26px;
	}
	.ghost {
		background: #9a9aa4;
	}
	.g1 {
		transform: translateY(-14px) scale(0.96) rotate(-1deg);
		background: #c4c4ce;
	}
	.g2 {
		transform: translateY(-26px) scale(0.92) rotate(1deg);
		background: #8a8a94;
	}
	.card-top {
		display: grid;
		grid-template-rows: 1fr auto;
		padding: 14px;
		background: var(--placeholder);
		color: var(--ink);
		touch-action: pan-y;
		user-select: none;
		transition: transform 0.22s ease;
		transform: rotate(-3deg);
		cursor: grab;
	}
	.card-top.dragging {
		transition: none;
		cursor: grabbing;
	}
	.bars {
		position: absolute;
		top: 16px;
		left: 18px;
		display: flex;
		gap: 4px;
		z-index: 2;
	}
	.bars span {
		width: 36px;
		height: 4px;
		border-radius: var(--pill);
		background: rgba(14, 14, 16, 0.25);
	}
	.bars span.on {
		background: var(--ink);
	}
	.save-hint,
	.pass-hint {
		position: absolute;
		top: 16px;
		z-index: 2;
		padding: 6px 12px;
		border-radius: var(--pill);
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
		opacity: 0.85;
	}
	.save-hint {
		right: 16px;
		background: var(--accent-soft);
	}
	.pass-hint {
		right: 16px;
		background: var(--white);
		opacity: 0;
	}
	.save-hint.show {
		opacity: 1;
		background: var(--accent);
		color: var(--white);
	}
	.pass-hint.show {
		opacity: 1;
	}
	.save-hint:not(.show) + .pass-hint.show {
		z-index: 3;
	}
	.photo {
		border-radius: 18px;
		overflow: hidden;
		pointer-events: none;
	}
	.panel {
		margin-top: -110px;
		position: relative;
		display: grid;
		gap: 4px;
		padding: 16px 18px;
		border-radius: 18px;
		background: var(--white);
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.price {
		font-size: 30px;
	}
	.title {
		font-weight: 800;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
	}
	.dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 14px;
	}
	.round {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		border: 0;
		border-radius: 50%;
	}
	.pass {
		background: var(--ink-3);
		color: var(--white);
	}
	.like {
		background: var(--accent-soft);
		color: var(--ink);
	}
	.offer {
		min-height: 56px;
		padding: 0 24px;
		background: var(--white);
		color: var(--ink);
		font-size: 16px;
	}
	.help {
		margin-top: 14px;
		text-align: center;
		font-size: 13px;
		color: #a6a6b0;
	}
	.done {
		display: grid;
		justify-items: center;
		gap: 12px;
		text-align: center;
	}
	.done h2 {
		font-size: 22px;
	}

	/* Discrete drag positions: avoids inline styles so the CSP can forbid them. */
	.tilt-6 { rotate: -12deg; }
	.tilt-5 { rotate: -10deg; }
	.tilt-4 { rotate: -8deg; }
	.tilt-3 { rotate: -6deg; }
	.tilt-2 { rotate: -4deg; }
	.tilt-1 { rotate: -2deg; }
	.tilt0 { rotate: 0deg; }
	.tilt1 { rotate: 2deg; }
	.tilt2 { rotate: 4deg; }
	.tilt3 { rotate: 6deg; }
	.tilt4 { rotate: 8deg; }
	.tilt5 { rotate: 10deg; }
	.tilt6 { rotate: 12deg; }
	.shift-15 { translate: -600px 0; }
	.shift-14 { translate: -560px 0; }
	.shift-13 { translate: -520px 0; }
	.shift-12 { translate: -480px 0; }
	.shift-11 { translate: -440px 0; }
	.shift-10 { translate: -400px 0; }
	.shift-9 { translate: -360px 0; }
	.shift-8 { translate: -320px 0; }
	.shift-7 { translate: -280px 0; }
	.shift-6 { translate: -240px 0; }
	.shift-5 { translate: -200px 0; }
	.shift-4 { translate: -160px 0; }
	.shift-3 { translate: -120px 0; }
	.shift-2 { translate: -80px 0; }
	.shift-1 { translate: -40px 0; }
	.shift0 { translate: 0 0; }
	.shift1 { translate: 40px 0; }
	.shift2 { translate: 80px 0; }
	.shift3 { translate: 120px 0; }
	.shift4 { translate: 160px 0; }
	.shift5 { translate: 200px 0; }
	.shift6 { translate: 240px 0; }
	.shift7 { translate: 280px 0; }
	.shift8 { translate: 320px 0; }
	.shift9 { translate: 360px 0; }
	.shift10 { translate: 400px 0; }
	.shift11 { translate: 440px 0; }
	.shift12 { translate: 480px 0; }
	.shift13 { translate: 520px 0; }
	.shift14 { translate: 560px 0; }
	.shift15 { translate: 600px 0; }
	.card-top.leaving {
		opacity: 0;
		transition:
			translate 0.22s ease,
			rotate 0.22s ease,
			opacity 0.22s ease;
	}
	.card-top:not(.dragging) {
		transition:
			translate 0.22s ease,
			rotate 0.22s ease;
	}
</style>
