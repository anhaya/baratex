<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import OfferDialog from '$lib/components/OfferDialog.svelte';
	import Photo from '$lib/components/Photo.svelte';
	import { formatBRL } from '$lib/utils/format';

	let { data, form } = $props();

	const conv = $derived(data.detail.conversation);
	const listing = $derived(data.detail.listing);
	const other = $derived(data.detail.other);
	const me = $derived(data.detail.viewer.id);
	const iAmBuyer = $derived(conv.buyerId === me);

	let text = $state('');
	let counterFor = $state<string | null>(null);
	let counterAmount = $state('');
	let offerOpen = $state(false);
	let thread: HTMLElement | undefined = $state();

	const QUICK = ['Posso retirar hoje?', 'Tem nota fiscal?', 'Mais fotos?'];

	const statusLabel = { pending: '', accepted: 'Aceita', countered: 'Contraproposta recebida', declined: 'Substituída' } as const;

	async function scrollDown() {
		await tick();
		thread?.lastElementChild?.scrollIntoView({ block: 'end' });
	}
	$effect(() => {
		void conv.messages.length;
		scrollDown();
	});

	// Fixed time zone so the server render and the browser agree on "Hoje".
	const TZ = 'America/Sao_Paulo';
	const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
	const dayLabel = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: 'numeric', month: 'short' });
	const day = (iso: string) => {
		if (!iso) return '';
		const d = new Date(iso);
		return dayKey.format(d) === dayKey.format(new Date()) ? 'Hoje' : dayLabel.format(d);
	};
</script>

<svelte:head><title>Conversa com {other.name} · baratex</title></svelte:head>

<main class="conv">
	<header class="head">
		<a href="/mensagens" class="icon-btn plain" aria-label="Voltar para mensagens"><Icon name="chevron-left" size={22} /></a>
		<Avatar name={other.name} size="m" tone="soft" />
		<div>
			<h1>@{other.handle}</h1>
			<p class="sub">{other.verified ? 'Verificada · ' : ''}responde em {other.responseTime}</p>
		</div>
	</header>

	<a class="item" href="/anuncio/{listing.id}">
		<span class="thumb"><Photo photo={listing.photos[0]} size={56} /></span>
		<span class="item-body">
			<strong>{listing.title}</strong>
			<span class="muted">{formatBRL(listing.price)}{listing.shipping.deliveryPrice !== null ? ` · entrega ${formatBRL(listing.shipping.deliveryPrice)}` : ''}</span>
		</span>
		<Icon name="chevron-right" size={20} />
	</a>

	<ol class="thread" bind:this={thread} aria-label="Mensagens">
		{#each conv.messages as m, i (m.id)}
			{#if i === 0 || day(m.createdAt) !== day(conv.messages[i - 1]?.createdAt ?? '')}
				<li class="day">{day(m.createdAt)}</li>
			{/if}
			{#if m.kind === 'text'}
				<li class="bubble" class:mine={m.authorId === me}>{m.text}</li>
			{:else if m.authorId === me}
				<li class="offer mine-offer" class:faded={m.status !== 'pending' && m.status !== 'accepted'}>
					<span class="label">Sua oferta {statusLabel[m.status] ? `· ${statusLabel[m.status]}` : ''}</span>
					<span class="amount display">{formatBRL(m.amount)} <s>{formatBRL(listing.price)}</s></span>
					<span class="muted note">Vale por 24 h · se aceita, o pagamento já sai protegido</span>
				</li>
			{:else}
				<li class="offer theirs">
					<span class="label">{iAmBuyer ? 'Contraproposta' : 'Oferta recebida'} {statusLabel[m.status] && m.status !== 'countered' ? `· ${statusLabel[m.status]}` : ''}</span>
					<span class="amount display">{formatBRL(m.amount)}</span>
					{#if m.status === 'pending'}
						{#if counterFor === m.id}
							<form method="POST" action="?/counter" class="counter" use:enhance={() => async ({ update, result }) => { await update(); if (result.type === 'success') counterFor = null; }}>
								<input type="hidden" name="messageId" value={m.id} />
								<label class="visually-hidden" for="counter-{m.id}">Valor da contraproposta</label>
								<span class="rs">R$</span>
								<input id="counter-{m.id}" name="amount" inputmode="decimal" required maxlength="10" pattern="[0-9.,]+" bind:value={counterAmount} />
								<button class="btn btn-primary btn-sm">Enviar</button>
								<button type="button" class="btn btn-outline btn-sm" onclick={() => (counterFor = null)}>Cancelar</button>
							</form>
						{:else}
							<div class="offer-actions">
								<form method="POST" action="?/accept" use:enhance>
									<input type="hidden" name="messageId" value={m.id} />
									<button class="btn btn-primary">Aceitar</button>
								</form>
								<button
									type="button"
									class="btn btn-outline dark-outline"
									onclick={() => {
										counterFor = m.id;
										counterAmount = String(Math.round(m.amount / 100) - 20);
									}}>Contrapor</button
								>
							</div>
						{/if}
					{:else if m.status === 'accepted'}
						<a class="btn btn-primary btn-sm pay" href="/anuncio/{listing.id}">Pagar pelo baratex</a>
					{/if}
				</li>
			{/if}
		{/each}
	</ol>

	{#if form?.message}<p class="error-text pad" role="alert">{form.message}</p>{/if}

	<p class="safety"><Icon name="shield" size={18} />Pague sempre pelo baratex. Pix ou link de pagamento por fora não têm proteção.</p>

	<div class="composer">
		<div class="quick">
			{#each QUICK as q (q)}
				<form method="POST" action="?/send" use:enhance>
					<input type="hidden" name="text" value={q} />
					<button class="btn btn-outline btn-sm">{q}</button>
				</form>
			{/each}
		</div>
		<div class="input-row">
			{#if iAmBuyer && listing.status === 'available'}
				<button type="button" class="btn btn-soft offer-btn" onclick={() => (offerOpen = true)}>Oferta</button>
			{/if}
			<form method="POST" action="?/send" class="send-form" use:enhance={() => async ({ update }) => update({ reset: true })}>
				<label class="visually-hidden" for="msg">Escreva uma mensagem</label>
				<input id="msg" name="text" bind:value={text} placeholder="Escreva uma mensagem" maxlength="1000" required autocomplete="off" />
				<button class="send" aria-label="Enviar mensagem"><Icon name="send" size={20} /></button>
			</form>
		</div>
	</div>
</main>

<OfferDialog bind:open={offerOpen} listingId={listing.id} title={listing.title} price={listing.price} />

<style>
	.conv {
		display: grid;
		grid-template-rows: auto auto 1fr auto auto;
		max-width: 760px;
		min-height: calc(100vh - var(--header-h) - 48px);
		border: 1.5px solid var(--line);
		border-radius: var(--radius-xl);
		overflow: hidden;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
	}
	.plain {
		border: 0;
	}
	h1 {
		font-size: 17px;
		font-weight: 800;
	}
	.sub {
		font-size: 12px;
		font-weight: 600;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 0 16px;
		padding: 10px 12px;
		border-radius: var(--radius-m);
		background: var(--surface);
	}
	.thumb {
		flex: none;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		overflow: hidden;
		border: 1.5px solid var(--line);
	}
	.item-body {
		flex: 1;
		display: grid;
		font-size: 13px;
	}
	.item-body strong {
		font-size: 14px;
	}
	.thread {
		list-style: none;
		margin: 0;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		border-top: 1.5px solid var(--line);
		margin-top: 14px;
	}
	.day {
		align-self: center;
		font-size: 12px;
		color: var(--muted);
	}
	.bubble {
		align-self: flex-start;
		max-width: 80%;
		padding: 10px 14px;
		border-radius: 16px 16px 16px 4px;
		border: 1.5px solid var(--line);
		background: var(--white);
	}
	.bubble.mine {
		align-self: flex-end;
		border-radius: 16px 16px 4px 16px;
		background: var(--ink);
		border-color: var(--ink);
		color: var(--white);
	}
	.offer {
		display: grid;
		gap: 6px;
		max-width: 320px;
	}
	.mine-offer {
		align-self: flex-end;
		width: 100%;
		padding: 16px;
		border: 2px solid var(--ink);
		border-radius: var(--radius-l);
	}
	.faded {
		opacity: 0.6;
	}
	.theirs {
		align-self: flex-start;
		width: 100%;
		padding: 8px 0;
	}
	.label {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.amount {
		font-size: 30px;
	}
	.amount s {
		font-family: var(--font-body);
		font-size: 14px;
		font-weight: 500;
		color: var(--muted);
	}
	.note {
		font-size: 12px;
	}
	.offer-actions {
		display: flex;
		gap: 10px;
	}
	.offer-actions .btn {
		min-width: 130px;
	}
	.dark-outline {
		border-color: var(--ink);
	}
	.counter {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.counter input {
		width: 110px;
		min-height: 40px;
		padding: 0 10px;
		border: 2px solid var(--ink);
		border-radius: var(--radius-s);
		font-weight: 800;
	}
	.rs {
		font-weight: 800;
	}
	.pay {
		justify-self: start;
	}
	.pad {
		padding: 0 16px;
	}
	.safety {
		display: flex;
		gap: 10px;
		align-items: center;
		margin: 8px 16px;
		padding: 12px 14px;
		border-radius: var(--radius-m);
		background: var(--line-2);
		font-size: 13px;
	}
	.safety :global(svg) {
		flex: none;
	}
	.composer {
		display: grid;
		gap: 10px;
		padding: 12px 16px 16px;
		border-top: 1.5px solid var(--line);
		background: var(--white);
	}
	.quick {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.input-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.offer-btn {
		flex: none;
	}
	.send-form {
		flex: 1;
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.send-form input {
		flex: 1;
		min-width: 0;
		min-height: 44px;
		padding: 0 16px;
		border: 1.5px solid var(--line);
		border-radius: var(--pill);
		background: var(--surface-2);
	}
	.send {
		display: grid;
		place-items: center;
		flex: none;
		width: 46px;
		height: 46px;
		border: 0;
		border-radius: 50%;
		background: var(--ink);
		color: var(--white);
	}
	@media (max-width: 1023px) {
		.conv {
			min-height: 100dvh;
			border: 0;
			border-radius: 0;
		}
		.head {
			position: sticky;
			top: 0;
			z-index: 5;
			background: var(--white);
		}
		.composer {
			position: sticky;
			bottom: 0;
			padding-bottom: calc(12px + env(safe-area-inset-bottom));
		}
	}
</style>
