<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { tick, untrack } from 'svelte';
	import type { AiAnswer, AiRequest, FilterKey } from '$lib/api/schemas';
	import type { ListingWithSeller } from '$lib/api/types';
	import Icon from '$lib/components/Icon.svelte';
	import Photo from '$lib/components/Photo.svelte';
	import { formatBRL, formatKm, rating } from '$lib/utils/format';

	let { data } = $props();

	interface Turn {
		request: AiRequest;
		answer: AiAnswer;
		results: ListingWithSeller[];
		showAll?: boolean;
		alertSaved?: boolean;
	}

	// The conversation lives on the client; the server only answers each turn.
	let turns = $state<Turn[]>([untrack(() => data.first)]);

	let draft = $state('');
	let busy = $state(false);
	let error = $state('');
	let alertOn = $state(true);
	let thread: HTMLElement | undefined = $state();

	const last = $derived(turns.at(-1));
	const byId = (turn: Turn, id: string) => turn.results.find((r) => r.listing.id === id);

	async function post(action: string, fields: Record<string, string>) {
		const body = new FormData();
		for (const [k, v] of Object.entries(fields)) body.set(k, v);
		const res = await fetch(`?/${action}`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
		return deserialize(await res.text());
	}

	async function ask(message: string, opts: { replace?: boolean; disabled?: FilterKey[] } = {}) {
		if (busy || !message.trim()) return;
		busy = true;
		error = '';
		const base = opts.replace ? turns.at(-1)?.request : undefined;
		const context = opts.replace ? (base?.context ?? '') : (last?.answer.query ?? '');
		const disabled = opts.disabled ?? last?.request.disabled ?? [];
		try {
			const result = await post('ask', { context, message, disabled: disabled.join(',') });
			if (result.type === 'success' && result.data?.turn) {
				const turn = result.data.turn as Turn;
				turns = opts.replace ? [...turns.slice(0, -1), turn] : [...turns, turn];
				draft = '';
				await tick();
				thread?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} else {
				error = result.type === 'failure' ? String(result.data?.message ?? '') : 'Não consegui buscar agora.';
			}
		} catch {
			error = 'Sem conexão. Tente de novo.';
		} finally {
			busy = false;
		}
	}

	function removeFilter(key: FilterKey) {
		const turn = turns.at(-1);
		if (!turn) return;
		ask(turn.request.message, { replace: true, disabled: [...turn.request.disabled, key] });
	}

	async function saveAlert(turn: Turn) {
		const label = turn.answer.filters.find((f) => f.key === 'category')?.value ?? turn.request.message.slice(0, 60);
		const result = await post('alert', { label });
		if (result.type === 'success') {
			turn.alertSaved = true;
			await invalidate('app:counts');
		}
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		ask(draft);
	}
</script>

<svelte:head><title>baratex · Chat com IA</title></svelte:head>

<div class="layout">
	<main class="chat">
		<header class="mobile-bar">
			<a href="/" class="icon-btn plain" aria-label="Voltar"><Icon name="chevron-left" size={22} /></a>
			<span class="ai-avatar small"><Icon name="sparkle" size={18} /></span>
			<div>
				<h1 class="title">Chat com IA</h1>
				<p class="muted sub">Procura em tudo à venda perto de você</p>
			</div>
		</header>

		<div class="thread" bind:this={thread} aria-live="polite">
			{#each turns as turn, t (t)}
				<section class="turn">
					<p class="user-msg">{turn.request.message}</p>
					<div class="ai">
						<span class="ai-avatar desk"><Icon name="sparkle" size={20} /></span>
						<div class="ai-body">
							<p>{turn.answer.intro}</p>

							{#if turn.answer.picks.length}
								<ol class="picks">
									{#each turn.answer.picks as pick, i (pick.listingId)}
										{@const r = byId(turn, pick.listingId)}
										{#if r}
											<li class="pick card">
												<span class="num">{i + 1}</span>
												<a href="/anuncio/{r.listing.id}" class="thumb" tabindex="-1" aria-hidden="true">
													<Photo photo={r.listing.photos[0]} size={120} fit="cover" />
													<span class="mprice">{formatBRL(r.listing.price)}</span>
												</a>
												<div class="pick-info">
													<h2><span class="price display">{formatBRL(r.listing.price)}</span> <a href="/anuncio/{r.listing.id}">{r.listing.title}</a></h2>
													<p class="muted meta">{formatKm(r.listing.distanceKm)} · {r.seller.name}, {rating(r.seller.rating)}</p>
													<p class="why"><strong class="desk-inline">Por que combina:</strong> {pick.reason}</p>
												</div>
												<div class="pick-actions">
													<a class="btn btn-dark btn-sm" href="/anuncio/{r.listing.id}">Ver peça</a>
													<a class="btn btn-outline btn-sm" href="/anuncio/{r.listing.id}#comentarios">Perguntar</a>
												</div>
											</li>
										{/if}
									{/each}
								</ol>
							{/if}

							<p>{turn.answer.outro}</p>

							{#if turn.answer.offerAlert && t === turns.length - 1}
								<div class="replies">
									{#if turn.alertSaved}
										<span class="chip saved"><Icon name="check" size={16} />Procura-se publicado. Te aviso!</span>
									{:else}
										<button type="button" class="btn btn-outline strong" onclick={() => saveAlert(turn)}>Sim, publicar e avisar</button>
									{/if}
									{#if turn.answer.totalFound > turn.answer.picks.length}
										<button type="button" class="btn btn-outline" onclick={() => (turn.showAll = !turn.showAll)} aria-expanded={!!turn.showAll}>
											{turn.showAll ? 'Esconder resultados' : `Ver os ${turn.answer.totalFound} resultados`}
										</button>
									{/if}
								</div>
							{/if}

							{#if turn.showAll}
								<ul class="all">
									{#each turn.results as r (r.listing.id)}
										<li>
											<a href="/anuncio/{r.listing.id}">
												<strong>{formatBRL(r.listing.price)}</strong>
												{r.listing.title}
												<span class="muted">· {formatKm(r.listing.distanceKm)}</span>
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				</section>
			{/each}
			{#if busy}<p class="muted thinking">Procurando…</p>{/if}
		</div>

		<div class="composer">
			{#if last}
				<div class="suggestions">
					{#each last.answer.suggestions as s (s)}
						<button type="button" class="btn btn-outline btn-sm" onclick={() => ask(s)} disabled={busy}>{s}</button>
					{/each}
				</div>
			{/if}
			{#if error}<p class="error-text" role="alert">{error}</p>{/if}
			<!-- Without JavaScript this falls back to a fresh search via the URL. -->
			<form method="GET" action="/chat" onsubmit={submit} class="input-row">
				<label class="visually-hidden" for="ask">Refine a busca</label>
				<input
					id="ask"
					name="q"
					bind:value={draft}
					placeholder="Refine: “tem que caber no porta-malas de um Onix”"
					maxlength="300"
					autocomplete="off"
					required
				/>
				<button class="send" aria-label="Enviar" disabled={busy}><Icon name="send" size={20} /></button>
			</form>
		</div>
	</main>

	<aside class="rail">
		{#if last}
			<section class="card understood" aria-labelledby="understood">
				<h2 id="understood">O que eu entendi</h2>
				<p class="muted small">Toque para ajustar. A conversa e os resultados se atualizam juntos.</p>
				<ul class="filters">
					{#each last.answer.filters as f (f.key)}
						<li>
							<span class="filter">
								<span class="muted">{f.label}</span>
								<strong>{f.value}</strong>
								<button type="button" aria-label="Remover filtro {f.label}" onclick={() => removeFilter(f.key)} disabled={busy}>
									<Icon name="close" size={12} strokeWidth={2.4} />
								</button>
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<label class="alert-card">
			<span>
				<strong>Alerta desta busca</strong>
				<small>Aviso quando surgir algo parecido</small>
			</span>
			<input type="checkbox" role="switch" bind:checked={alertOn} />
			<span class="switch" aria-hidden="true"></span>
		</label>

		<section class="card saved-list" aria-labelledby="saved">
			<h2 id="saved">Buscas salvas</h2>
			<ul>
				{#each data.savedSearches as s (s.id)}
					<li>
						<a href="/chat?q={encodeURIComponent(s.label)}" data-sveltekit-reload>{s.label}</a>
						{#if s.newCount > 0}<span class="new">{s.newCount} {s.newCount === 1 ? 'novo' : 'novos'}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	</aside>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 32px;
		align-items: start;
	}
	.chat {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - var(--header-h) - 48px);
		max-width: 760px;
		width: 100%;
		margin: 0 auto;
	}
	.mobile-bar {
		display: none;
	}
	.thread {
		flex: 1;
		display: grid;
		align-content: start;
		gap: 32px;
		padding-bottom: 24px;
	}
	.turn {
		display: grid;
		gap: 20px;
	}
	.user-msg {
		justify-self: end;
		max-width: 600px;
		padding: 14px 18px;
		border-radius: 18px 18px 4px 18px;
		background: var(--ink);
		color: var(--white);
	}
	.ai {
		display: flex;
		gap: 14px;
	}
	.ai-avatar {
		display: grid;
		place-items: center;
		flex: none;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 2px solid var(--ink);
		background: var(--accent-softer);
	}
	.ai-avatar.small {
		width: 40px;
		height: 40px;
	}
	.ai-body {
		display: grid;
		gap: 14px;
		min-width: 0;
		flex: 1;
	}
	.picks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 14px;
	}
	.pick {
		position: relative;
		display: grid;
		grid-template-columns: 120px minmax(0, 1fr) auto;
		gap: 16px;
		align-items: center;
		padding: 12px;
		border-radius: var(--radius-l);
	}
	.num {
		position: absolute;
		top: 18px;
		left: 18px;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--white);
		font-size: 12px;
		font-weight: 800;
	}
	.thumb {
		position: relative;
		width: 120px;
		height: 120px;
		border-radius: 14px;
		overflow: hidden;
	}
	.mprice {
		display: none;
	}
	.pick-info {
		display: grid;
		gap: 6px;
	}
	.pick-info h2 {
		font-size: 15px;
		font-weight: 800;
	}
	.price {
		font-size: 22px;
		margin-right: 6px;
	}
	.meta {
		font-size: 13px;
	}
	.why {
		padding: 8px 10px;
		border-radius: 10px;
		background: var(--accent-softer);
		font-size: 13px;
	}
	.pick-actions {
		display: grid;
		gap: 8px;
	}
	.replies {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.strong {
		border: 2px solid var(--ink);
		background: var(--accent-soft);
	}
	.saved {
		background: var(--accent-soft);
		color: var(--accent-ink);
		min-height: 44px;
		padding: 0 16px;
	}
	.all {
		margin: 0;
		padding: 12px 16px;
		list-style: none;
		display: grid;
		gap: 8px;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-m);
		font-size: 14px;
	}
	.all a:hover {
		text-decoration: underline;
	}
	.thinking {
		font-weight: 700;
	}
	.composer {
		position: sticky;
		bottom: 0;
		display: grid;
		gap: 10px;
		padding: 12px 0 8px;
		background: var(--white);
	}
	.suggestions {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.input-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 6px 6px 20px;
		border: 2px solid var(--ink);
		border-radius: var(--pill);
	}
	.input-row input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		min-height: 40px;
	}
	.send {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 50%;
		background: var(--ink);
		color: var(--white);
	}
	.rail {
		position: sticky;
		top: calc(var(--header-h) + 24px);
		display: grid;
		gap: 16px;
	}
	.understood,
	.saved-list {
		display: grid;
		gap: 12px;
		padding: 20px;
	}
	.rail h2 {
		font-size: 15px;
		font-weight: 800;
	}
	.small {
		font-size: 13px;
	}
	.filters {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
		justify-items: start;
	}
	.filter {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 6px 6px 12px;
		border: 1.5px solid var(--ink);
		border-radius: var(--pill);
		font-size: 13px;
	}
	.filter button {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--surface);
	}
	.alert-card {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px 20px;
		border-radius: var(--radius-l);
		background: var(--ink);
		color: var(--white);
		cursor: pointer;
	}
	.alert-card span:first-child {
		display: grid;
	}
	.alert-card small {
		color: #c9c9d4;
	}
	.alert-card input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.switch {
		position: relative;
		flex: none;
		width: 52px;
		height: 30px;
		border-radius: var(--pill);
		background: var(--ink-3);
		transition: background 0.2s;
	}
	.switch::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--white);
		transition: transform 0.2s;
	}
	.alert-card input:checked + .switch {
		background: var(--accent-soft);
	}
	.alert-card input:checked + .switch::after {
		transform: translateX(22px);
		background: var(--ink);
	}
	.alert-card input:focus-visible + .switch {
		outline: 3px solid var(--accent-light);
		outline-offset: 2px;
	}
	.saved-list ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
	}
	.saved-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 0;
		border-top: 1.5px solid var(--line);
		font-weight: 700;
		font-size: 14px;
	}
	.saved-list li:first-child {
		border-top: 0;
	}
	.new {
		padding: 2px 8px;
		border-radius: var(--pill);
		background: var(--danger);
		color: var(--white);
		font-size: 12px;
	}

	@media (max-width: 1279px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 280px;
		}
	}
	@media (max-width: 1023px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
		.rail {
			display: none;
		}
		.chat {
			min-height: 100dvh;
		}
		.mobile-bar {
			position: sticky;
			top: 0;
			z-index: 10;
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			background: var(--white);
			border-bottom: 1.5px solid var(--line);
		}
		.plain {
			border: 0;
		}
		.title {
			font-size: 16px;
			font-weight: 800;
		}
		.sub {
			font-size: 12px;
		}
		.thread {
			padding: 16px;
			gap: 24px;
		}
		.desk {
			display: none;
		}
		.user-msg {
			max-width: 85%;
		}
		.picks {
			display: flex;
			overflow-x: auto;
			gap: 10px;
			margin-right: -16px;
			padding-right: 16px;
			scroll-snap-type: x mandatory;
		}
		.pick {
			flex: 0 0 220px;
			grid-template-columns: 1fr;
			align-items: start;
			scroll-snap-align: start;
			gap: 10px;
		}
		.num,
		.pick-actions,
		.price,
		.desk-inline {
			display: none;
		}
		.thumb {
			width: 100%;
			height: 140px;
		}
		.mprice {
			display: block;
			position: absolute;
			left: 10px;
			bottom: 10px;
			padding: 4px 12px;
			border-radius: var(--pill);
			background: var(--white);
			font-weight: 800;
		}
		.why {
			order: 3;
		}
		.composer {
			padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
			border-top: 1.5px solid var(--line);
		}
	}
</style>
