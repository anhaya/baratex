<script lang="ts">
	import FavoriteCard from '$lib/components/FavoriteCard.svelte';
	import Menu from '$lib/components/Menu.svelte';

	let { data } = $props();

	const TABS = [
		{ key: 'todos', label: 'Todos' },
		{ key: 'baixou', label: 'Baixou o preço' },
		{ key: 'oferta', label: 'Com oferta minha' },
		{ key: 'disponiveis', label: 'Disponíveis' },
		{ key: 'vendidos', label: 'Vendidos' }
	] as const;
	const SORTS = { recentes: 'Adicionados recentemente', preco: 'Menor preço', perto: 'Mais perto' } as const;

	const href = (filtro: string, ordem: string) => {
		const p = new URLSearchParams();
		if (filtro !== 'todos') p.set('filtro', filtro);
		if (ordem !== 'recentes') p.set('ordem', ordem);
		const qs = p.toString();
		return qs ? `/favoritos?${qs}` : '/favoritos';
	};
</script>

<svelte:head><title>baratex · Favoritos</title></svelte:head>

<main class="page">
	<header>
		<h1 class="display">Favoritos</h1>
		<p class="muted">Avisamos quando um favorito baixar de preço, receber comentários ou for vendido.</p>
	</header>

	<div class="bar">
		<nav class="tabs" aria-label="Filtrar favoritos">
			{#each TABS as t (t.key)}
				<a href={href(t.key, data.ordem)} class="tab" class:on={data.filtro === t.key} aria-current={data.filtro === t.key ? 'true' : undefined} data-sveltekit-noscroll>
					{t.label}<span class="n">{data.counts[t.key]}</span>
				</a>
			{/each}
		</nav>
		<Menu label={SORTS[data.ordem]} align="end">
			{#each Object.entries(SORTS) as [key, label] (key)}
				<a href={href(data.filtro, key)} role="menuitem" aria-current={data.ordem === key ? 'true' : undefined} data-sveltekit-noscroll>{label}</a>
			{/each}
		</Menu>
	</div>

	{#if data.items.length === 0}
		<p class="empty muted">Nenhum favorito aqui. Toque na estrela de um anúncio para salvar.</p>
	{:else}
		<div class="grid">
			{#each data.items as item (item.listing.id)}
				<FavoriteCard {item} />
			{/each}
		</div>
	{/if}
</main>

<style>
	.page {
		display: grid;
		gap: 20px;
	}
	h1 {
		font-size: 34px;
	}
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.tabs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 38px;
		padding: 0 14px;
		border-radius: var(--pill);
		background: var(--surface);
		font-size: 14px;
		font-weight: 700;
		white-space: nowrap;
	}
	.n {
		padding: 1px 7px;
		border-radius: var(--pill);
		background: var(--line-2);
		font-size: 11px;
	}
	.tab.on {
		background: var(--accent);
		color: var(--white);
	}
	.tab.on .n {
		background: rgba(255, 255, 255, 0.25);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 16px;
	}
	.empty {
		padding: 48px 0;
	}
	@media (max-width: 1023px) {
		.page {
			padding: 8px 12px 0;
		}
		h1 {
			font-size: 26px;
		}
		.bar {
			flex-direction: column;
			align-items: stretch;
		}
		.tabs {
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
		}
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
		}
	}
</style>
