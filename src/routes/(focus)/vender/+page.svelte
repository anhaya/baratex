<script lang="ts">
	import { enhance } from '$app/forms';
	import { onDestroy } from 'svelte';
	import type { Category, Condition } from '$lib/api/schemas';
	import Icon from '$lib/components/Icon.svelte';
	import { CATEGORY_LABELS, CONDITION_LABELS } from '$lib/labels';
	import { formatBRL, parseBRL } from '$lib/utils/format';
	import { daysToSell, sellerNet } from '$lib/utils/pricing';

	let { form } = $props();

	const MAX_PHOTOS = 12;
	const MAX_BYTES = 10 * 1024 * 1024;
	const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

	// Placeholder for the backend's photo recognition: it will suggest these from the images.
	const SUGGESTION = {
		title: 'Bicicleta aro 26 com cestinha',
		category: 'esportes' as Category,
		path: ['Esportes', 'Ciclismo', 'Bicicletas'],
		condition: 'muito_bom' as Condition,
		price: '650',
		range: { min: 45_000, max: 85_000 }
	};

	let step = $state(1);
	let photos = $state<{ url: string; name: string }[]>([]);
	let photoError = $state('');
	let title = $state('');
	let description = $state('');
	let category = $state<Category>('esportes');
	let condition = $state<Condition>('muito_bom');
	let price = $state('');
	let prefilled = $state(false);
	let sending = $state(false);

	const cents = $derived(parseBRL(price));
	const canContinue = $derived(
		step === 1 ? photos.length > 0 : step === 2 ? title.trim().length >= 3 && cents !== null && cents >= 100 : true
	);

	function addPhotos(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		photoError = '';
		for (const file of Array.from(input.files ?? [])) {
			if (photos.length >= MAX_PHOTOS) {
				photoError = `Máximo de ${MAX_PHOTOS} fotos.`;
				break;
			}
			if (!ACCEPTED.includes(file.type)) {
				photoError = 'Use fotos JPG, PNG, WEBP ou HEIC.';
				continue;
			}
			if (file.size > MAX_BYTES) {
				photoError = 'Cada foto pode ter até 10 MB.';
				continue;
			}
			// Previews stay in this browser; nothing is uploaded until the backend exists.
			photos.push({ url: URL.createObjectURL(file), name: file.name });
		}
		input.value = '';
		if (photos.length && !prefilled) {
			title = SUGGESTION.title;
			category = SUGGESTION.category;
			condition = SUGGESTION.condition;
			price = SUGGESTION.price;
			prefilled = true;
		}
	}

	function removePhoto(i: number) {
		const [gone] = photos.splice(i, 1);
		if (gone) URL.revokeObjectURL(gone.url);
	}

	onDestroy(() => photos.forEach((p) => URL.revokeObjectURL(p.url)));
</script>

<svelte:head><title>baratex · Anunciar</title></svelte:head>

<main class="sell">
	<header class="bar">
		<a href="/" class="close" aria-label="Cancelar anúncio"><Icon name="close" size={24} /></a>
		<h1>Anunciar</h1>
		<span class="muted">Passo {step} de 3</span>
	</header>
	<div class="progress" aria-hidden="true">
		{#each [1, 2, 3] as s (s)}<span class:on={s <= step}></span>{/each}
	</div>

	<form
		method="POST"
		action="?/publish"
		use:enhance={() => {
			sending = true;
			return async ({ update }) => {
				sending = false;
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="photoCount" value={photos.length} />

		<section class="photos" aria-label="Fotos">
			{#each photos as p, i (p.url)}
				<figure class="ph">
					<img src={p.url} alt="Foto {i + 1}" />
					{#if i === 0}<span class="capa">Capa</span>{/if}
					<button type="button" class="rm" aria-label="Remover foto {i + 1}" onclick={() => removePhoto(i)}><Icon name="close" size={14} /></button>
				</figure>
			{/each}
			{#if photos.length < MAX_PHOTOS}
				<label class="ph add">
					<Icon name="camera" size={20} />
					<span>{photos.length ? '+ fotos' : 'Adicionar fotos'}</span>
					<input type="file" accept={ACCEPTED.join(',')} multiple onchange={addPhotos} class="visually-hidden" />
				</label>
			{/if}
		</section>
		{#if photoError}<p class="error-text" role="alert">{photoError}</p>{/if}

		{#if step === 1}
			<p class="hint muted">Comece pelas fotos. Com elas a gente sugere título, categoria e preço.</p>
		{/if}

		<div class="details" class:hidden={step < 2}>
			{#if prefilled}
				<p class="filled"><Icon name="check" size={20} />Pelas fotos, já preenchemos título, categoria e detalhes. Confira e ajuste o que quiser.</p>
			{/if}

			<label class="lbl" for="title">Título</label>
			<input id="title" name="title" class="field big" bind:value={title} maxlength="80" required minlength="3" />
			<p class="path muted">
				{#if prefilled && category === SUGGESTION.category}{SUGGESTION.path.join(' › ')}{:else}{CATEGORY_LABELS[category]}{/if}
				·
				<label class="swap">trocar
					<select name="category" bind:value={category} aria-label="Categoria">
						{#each Object.entries(CATEGORY_LABELS) as [key, label] (key)}<option value={key}>{label}</option>{/each}
					</select>
				</label>
			</p>

			<fieldset>
				<legend class="lbl">Estado</legend>
				<div class="conds">
					{#each Object.entries(CONDITION_LABELS).reverse() as [key, label] (key)}
						<label class="cond" class:on={condition === key}>
							<input type="radio" name="condition" value={key} bind:group={condition} class="visually-hidden" />{label}
						</label>
					{/each}
				</div>
			</fieldset>

			<label class="lbl" for="description">Descrição <span class="muted">(opcional)</span></label>
			<textarea id="description" name="description" class="field area" bind:value={description} maxlength="2000" rows="3" placeholder="Uso, motivo da venda e o que acompanha"></textarea>

			<div class="price-box">
				<div class="row">
					<label for="price" class="lbl">Seu preço</label>
					<span class="muted small">parecidos: {formatBRL(SUGGESTION.range.min)} – {formatBRL(SUGGESTION.range.max).replace('R$ ', '')}</span>
				</div>
				<div class="price-input">
					<span>R$</span>
					<input id="price" name="price" inputmode="decimal" bind:value={price} required maxlength="10" pattern="[0-9.,]+" />
				</div>
				{#if cents !== null && cents > 0}
					<p class="eta"><Icon name="clock" size={16} />Nesse preço, itens assim costumam vender em {daysToSell(cents, SUGGESTION.range)} dias</p>
					<div class="net"><span class="muted">Você recebe</span><strong>{formatBRL(sellerNet(cents))}</strong></div>
				{/if}
			</div>
		</div>

		{#if step === 3}
			<section class="review card" aria-label="Revisão">
				<h2 class="display">{title}</h2>
				<p class="muted">{CATEGORY_LABELS[category]} · {CONDITION_LABELS[condition]} · {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</p>
				<p class="display price">{cents !== null ? formatBRL(cents) : ''}</p>
				<p class="muted small">Ao publicar, compradores perto de você veem no feed. A taxa de 10% só é cobrada quando vender.</p>
			</section>
		{/if}

		{#if form?.message}<p class="error-text" role="alert">{form.message}</p>{/if}

		<div class="footer">
			{#if step > 1}
				<button type="button" class="btn btn-outline" onclick={() => (step -= 1)}>Voltar</button>
			{/if}
			{#if step < 3}
				<button type="button" class="btn btn-primary btn-lg grow" disabled={!canContinue} onclick={() => (step += 1)}>Continuar</button>
			{:else}
				<button class="btn btn-primary btn-lg grow" disabled={sending}>{sending ? 'Publicando…' : 'Publicar anúncio'}</button>
			{/if}
		</div>
	</form>
</main>

<style>
	.sell {
		max-width: 560px;
		margin: 0 auto;
		padding: 16px 20px 0;
	}
	.bar {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		align-items: center;
	}
	.bar h1 {
		text-align: center;
		font-size: 17px;
		font-weight: 800;
	}
	.close {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
	}
	.progress {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
		margin: 16px 0 20px;
	}
	.progress span {
		height: 4px;
		border-radius: var(--pill);
		background: var(--line);
	}
	.progress span.on {
		background: var(--ink);
	}
	form {
		display: grid;
		gap: 14px;
	}
	.photos {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.ph {
		position: relative;
		margin: 0;
		aspect-ratio: 1;
		border: 1.5px solid var(--line);
		border-radius: 14px;
		overflow: hidden;
	}
	.ph img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.capa {
		position: absolute;
		left: 6px;
		bottom: 6px;
		padding: 2px 6px;
		border-radius: 6px;
		background: var(--ink);
		color: var(--white);
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
	}
	.rm {
		position: absolute;
		top: 4px;
		right: 4px;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
	}
	.add {
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 4px;
		border-style: dashed;
		padding: 6px;
		text-align: center;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}
	.add:focus-within {
		outline: 3px solid var(--accent);
	}
	.hint {
		font-size: 14px;
	}
	.details {
		display: grid;
		gap: 10px;
	}
	.hidden {
		display: none;
	}
	.filled {
		display: flex;
		gap: 10px;
		padding: 14px 16px;
		border-radius: var(--radius-m);
		background: var(--line-2);
		font-size: 14px;
	}
	.filled :global(svg) {
		flex: none;
	}
	.lbl {
		margin-top: 6px;
		font-size: 14px;
		font-weight: 800;
	}
	.big {
		min-height: 52px;
		font-size: 17px;
	}
	.area {
		padding: 12px 16px;
		resize: vertical;
	}
	.path {
		font-size: 13px;
	}
	.swap {
		position: relative;
		color: var(--ink);
		font-weight: 800;
		text-decoration: underline;
		cursor: pointer;
	}
	.swap select {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		display: grid;
		gap: 10px;
	}
	.conds {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.cond {
		display: inline-flex;
		align-items: center;
		min-height: 42px;
		padding: 0 16px;
		border: 1.5px solid var(--line);
		border-radius: var(--pill);
		font-weight: 600;
		cursor: pointer;
	}
	.cond.on {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--white);
		font-weight: 800;
	}
	.cond:focus-within {
		outline: 3px solid var(--accent);
	}
	.price-box {
		display: grid;
		gap: 10px;
		margin-top: 8px;
		padding: 16px;
		border-radius: var(--radius-l);
		background: var(--surface-2);
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.small {
		font-size: 13px;
	}
	.price-input {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 16px;
		border: 2px solid var(--ink);
		border-radius: var(--radius-m);
		background: var(--white);
		font-family: var(--font-display);
		font-weight: 700;
	}
	.price-input span {
		color: var(--muted);
		font-size: 18px;
	}
	.price-input input {
		width: 100%;
		border: 0;
		outline: none;
		font: inherit;
		font-size: 28px;
	}
	.eta {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 13px;
		font-weight: 700;
	}
	.net {
		display: flex;
		justify-content: space-between;
		padding-top: 10px;
		border-top: 1.5px dashed var(--line-2);
	}
	.review {
		display: grid;
		gap: 6px;
		padding: 18px;
	}
	.review h2 {
		font-size: 20px;
	}
	.review .price {
		font-size: 28px;
	}
	.footer {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: 10px;
		padding: 14px 0 calc(14px + env(safe-area-inset-bottom));
		background: var(--white);
		border-top: 1.5px solid var(--line);
	}
	.grow {
		flex: 1;
	}
</style>
