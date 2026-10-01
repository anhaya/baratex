<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Icon, { type IconName } from './Icon.svelte';

	interface Props {
		radiusKm: number | null;
		neighborhood: string;
		/** `instant` applies each change right away; `confirm` waits for the button. */
		mode?: 'instant' | 'confirm';
		onapplied?: () => void;
	}
	let { radiusKm, neighborhood, mode = 'instant', onapplied }: Props = $props();

	const MODES: { km: number | null; label: string; hint: string; icon: IconName }[] = [
		{ km: 1, label: 'A pé', hint: 'até 1 km', icon: 'walk' },
		{ km: 5, label: 'De bike', hint: 'até 5 km', icon: 'bike' },
		{ km: 15, label: 'De carro', hint: 'até 15 km', icon: 'car' },
		{ km: null, label: 'Qualquer lugar', hint: 'só com entrega', icon: 'truck' }
	];

	// Follows the saved value but can be changed locally before applying.
	let km = $derived<number | null>(radiusKm);
	let saving = $state(false);
	let error = $state('');

	const activeMode = $derived(
		km === null ? MODES[3] : MODES.find((m) => m.km !== null && km !== null && km <= m.km)
	);

	async function apply(value: number | null) {
		saving = true;
		error = '';
		const body = new FormData();
		body.set('raio', value === null ? 'entrega' : String(value));
		try {
			const res = await fetch('/preferencias/raio', {
				method: 'POST',
				body,
				headers: { accept: 'application/json' }
			});
			if (!res.ok) throw new Error(await res.text());
			await invalidateAll();
			onapplied?.();
		} catch {
			error = 'Não deu para salvar o raio. Tente de novo.';
		} finally {
			saving = false;
		}
	}

	function choose(value: number | null) {
		km = value;
		if (mode === 'instant') apply(value);
	}

	function step(delta: number) {
		const next = Math.min(50, Math.max(1, (km ?? 5) + delta));
		km = next;
		if (mode === 'instant') apply(next);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		apply(km);
	}
</script>

<form method="POST" action="/preferencias/raio" class="picker" onsubmit={submit} aria-busy={saving}>
	<input type="hidden" name="raio" value={km === null ? 'entrega' : km} />
	<input type="hidden" name="back" value={page.url.pathname + page.url.search} />

	<div class="where">
		<Icon name="pin" size={18} />
		<strong>{neighborhood}, São Paulo</strong>
		<a href="/perfil" class="change">Alterar</a>
	</div>

	<div class="modes" role="radiogroup" aria-label="Distância">
		{#each MODES as m (m.label)}
			<button
				type="button"
				role="radio"
				aria-checked={activeMode === m}
				class="mode"
				class:active={activeMode === m}
				onclick={() => choose(m.km)}
			>
				<Icon name={m.icon} size={18} />
				<span class="label">{m.label}</span>
				<span class="hint">{m.hint}</span>
			</button>
		{/each}
	</div>

	<div class="fine">
		<span>Ajuste fino</span>
		<div class="stepper">
			<button type="button" class="icon-btn" aria-label="Diminuir raio" onclick={() => step(-1)} disabled={km === null || km <= 1}>
				<Icon name="minus" size={16} />
			</button>
			<output class="display" aria-live="polite">{km === null ? '—' : `${km} km`}</output>
			<button type="button" class="icon-btn" aria-label="Aumentar raio" onclick={() => step(1)} disabled={km !== null && km >= 50}>
				<Icon name="plus" size={16} />
			</button>
		</div>
	</div>

	{#if error}<p class="error-text" role="alert">{error}</p>{/if}

	{#if mode === 'confirm'}
		<button class="btn btn-primary btn-block btn-lg" disabled={saving}>
			{km === null ? 'Ver anúncios com entrega' : `Ver anúncios até ${km} km`}
		</button>
	{:else}
		<noscript><button class="btn btn-primary btn-block">Aplicar</button></noscript>
	{/if}
</form>

<style>
	.picker {
		display: grid;
		gap: 12px;
	}
	.where {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		border-radius: var(--radius-s);
		background: var(--surface);
		border: 1.5px solid var(--line);
		font-size: 14px;
	}
	.where strong {
		flex: 1;
	}
	.change {
		color: var(--accent);
		font-weight: 700;
		font-size: 13px;
	}
	.modes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.mode {
		display: grid;
		justify-items: start;
		gap: 2px;
		padding: 14px 12px;
		border-radius: var(--radius-m);
		border: 1.5px solid var(--line);
		background: var(--white);
		text-align: left;
	}
	.mode:hover {
		border-color: var(--ink);
	}
	.mode .label {
		margin-top: 6px;
		font-weight: 800;
		font-size: 14px;
	}
	.mode .hint {
		font-size: 12px;
		color: var(--muted);
	}
	.mode.active {
		border: 2px solid var(--accent);
		background: var(--accent-softer);
		color: var(--accent);
	}
	.mode.active .hint {
		color: var(--accent);
	}
	.fine {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 12px;
		border-radius: var(--radius-m);
		background: var(--surface);
		font-size: 13px;
		font-weight: 700;
	}
	.stepper {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.stepper .icon-btn {
		width: 34px;
		height: 34px;
	}
	.stepper .icon-btn:disabled {
		opacity: 0.4;
	}
	output {
		min-width: 60px;
		text-align: center;
		font-size: 18px;
	}
</style>
