<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatBRL } from '$lib/utils/format';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		listingId: string;
		title: string;
		price: number;
	}
	let { open = $bindable(), listingId, title, price }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	let amount = $state('');
	let message = $state('');
	let sending = $state(false);

	// Round suggestions to R$ 5 steps; cheap items can collapse to the same value.
	const suggestions = $derived([
		...new Set([0.9, 0.85, 0.8].map((f) => Math.max(1, Math.round((price / 100) * f / 5) * 5)))
	].filter((v) => v * 100 < price));

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			amount = String(suggestions[0] ?? '');
			message = '';
			dialog.showModal();
		}
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="offer-title-{listingId}">
	<form
		method="POST"
		action="/anuncio/{listingId}?/offer"
		use:enhance={() => {
			sending = true;
			message = '';
			return async ({ result, update }) => {
				sending = false;
				if (result.type === 'failure') {
					message = String(result.data?.message ?? 'Não foi possível enviar');
					return;
				}
				open = false;
				await update();
			};
		}}
	>
		<header>
			<h2 id="offer-title-{listingId}" class="display">Fazer oferta</h2>
			<button type="button" class="icon-btn" aria-label="Fechar" onclick={() => (open = false)}><Icon name="close" size={18} /></button>
		</header>
		<p class="muted">{title} · anunciado por {formatBRL(price)}</p>

		<label class="amount">
			<span>R$</span>
			<input
				name="amount"
				inputmode="decimal"
				autocomplete="off"
				required
				maxlength="10"
				pattern="[0-9.,]+"
				bind:value={amount}
				aria-label="Valor da oferta em reais"
			/>
		</label>
		<div class="quick">
			{#each suggestions as s (s)}
				<button type="button" class="chip" onclick={() => (amount = String(s))}>R$ {s}</button>
			{/each}
		</div>
		{#if message}<p class="error-text" role="alert">{message}</p>{/if}
		<p class="note"><Icon name="shield" size={16} /> Vale por 24 h. Se aceita, o pagamento já sai protegido.</p>
		<button class="btn btn-primary btn-block btn-lg" disabled={sending}>{sending ? 'Enviando…' : 'Enviar oferta'}</button>
	</form>
</dialog>

<style>
	dialog {
		width: min(440px, calc(100% - 32px));
		padding: 0;
		border: 0;
		border-radius: var(--radius-xl);
		color: var(--ink);
	}
	dialog::backdrop {
		background: rgba(14, 14, 16, 0.5);
	}
	form {
		display: grid;
		gap: 14px;
		padding: 20px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h2 {
		font-size: 20px;
	}
	.amount {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 16px;
		border: 2px solid var(--ink);
		border-radius: var(--radius-m);
		font-family: var(--font-display);
		font-weight: 700;
	}
	.amount span {
		color: var(--muted);
		font-size: 18px;
	}
	.amount input {
		width: 100%;
		border: 0;
		outline: none;
		font: inherit;
		font-size: 30px;
	}
	.quick {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.quick .chip {
		border: 0;
	}
	.note {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 13px;
		color: var(--muted);
	}
</style>
