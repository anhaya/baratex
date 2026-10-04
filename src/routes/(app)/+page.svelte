<script lang="ts">
	import { page } from '$app/state';
	import type { Category } from '$lib/api/schemas';
	import AiFab from '$lib/components/AiFab.svelte';
	import DistancePicker from '$lib/components/DistancePicker.svelte';
	import FeedTile from '$lib/components/FeedTile.svelte';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import { CATEGORY_LABELS, MORE_CATEGORIES, PRIMARY_CATEGORIES } from '$lib/labels';

	let { data } = $props();

	const ICONS: Record<Category, IconName> = {
		casa: 'sofa',
		moda: 'shirt',
		eletronicos: 'laptop',
		esportes: 'ball',
		bebe: 'baby',
		lazer: 'music'
	};
	const SORTS = { recent: 'Mais recentes', nearest: 'Mais perto', cheapest: 'Menor preço' } as const;

	function hrefWith(changes: Record<string, string | null>) {
		const params = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(changes)) {
			if (v === null) params.delete(k);
			else params.set(k, v);
		}
		const qs = params.toString();
		return qs ? `/?${qs}` : '/';
	}

	let distanceOpen = $state(false);

	const moreActive = $derived(data.category !== null && MORE_CATEGORIES.includes(data.category));
</script>

<svelte:head>
	<title>baratex · Feed</title>
	<meta name="description" content="Compre e venda usados perto de você, com compra protegida." />
</svelte:head>

<main class="feed">
	<h1 class="visually-hidden">Feed</h1>
	<div class="filters">
		<nav class="cats" aria-label="Categorias">
			<a class="cat" class:on={data.category === null} href={hrefWith({ categoria: null })} aria-current={data.category === null ? 'true' : undefined}>
				<Icon name="grid" size={16} />Todas
			</a>
			{#each PRIMARY_CATEGORIES as c (c)}
				<a class="cat" class:on={data.category === c} href={hrefWith({ categoria: c })} aria-current={data.category === c ? 'true' : undefined}>
					<Icon name={ICONS[c]} size={16} />{CATEGORY_LABELS[c]}
				</a>
			{/each}
			{#each MORE_CATEGORIES as c (c)}
				<a class="cat mob-cat" class:on={data.category === c} href={hrefWith({ categoria: c })} aria-current={data.category === c ? 'true' : undefined}>
					<Icon name={ICONS[c]} size={16} />{CATEGORY_LABELS[c]}
				</a>
			{/each}
			<span class="desk-menu"><Menu label={moreActive && data.category ? CATEGORY_LABELS[data.category] : 'Mais categorias'} variant={moreActive ? 'active' : 'dashed'}>
				{#each MORE_CATEGORIES as c (c)}
					<a href={hrefWith({ categoria: c })} role="menuitem"><Icon name={ICONS[c]} size={16} />{CATEGORY_LABELS[c]}</a>
				{/each}
			</Menu></span>
		</nav>
		<button type="button" class="distance-pill" onclick={() => (distanceOpen = true)} aria-haspopup="dialog">
			<Icon name="pin" size={16} />{data.viewer.neighborhood} · {data.radiusKm === null ? 'só entrega' : `até ${data.radiusKm} km`}
		</button>
		<Menu label={SORTS[data.sort]} variant="plain" align="end">
			{#each Object.entries(SORTS) as [key, label] (key)}
				<a href={hrefWith({ ordem: key === 'recent' ? null : key })} role="menuitem" aria-current={data.sort === key ? 'true' : undefined}>{label}</a>
			{/each}
		</Menu>
	</div>

	{#if data.items.length === 0}
		<div class="empty card">
			<h2 class="display">Nada por aqui ainda</h2>
			<p class="muted">
				Não achamos anúncios {data.radiusKm === null ? 'com entrega' : `até ${data.radiusKm} km`} nesta categoria. Aumente a distância ou peça ajuda pra IA.
			</p>
			<a class="btn btn-primary" href="/chat"><Icon name="sparkle" size={18} />Perguntar pra IA</a>
		</div>
	{:else}
		<div class="posts">
			{#each data.items as item, i (item.listing.id)}
				<PostCard {item} people={data.people} viewer={data.viewer} eager={i === 0} />
			{/each}
		</div>
		<div class="grid">
			{#each data.items as item (item.listing.id)}
				<FeedTile {item} />
			{/each}
		</div>
		{#if data.hasMore}
			<a class="btn btn-outline more" href={hrefWith({ pagina: String(data.page + 1) })} data-sveltekit-noscroll>Ver mais anúncios</a>
		{/if}
	{/if}
</main>

<Sheet bind:open={distanceOpen} title="Até onde você vai buscar?">
	<DistancePicker radiusKm={data.radiusKm} neighborhood={data.viewer.neighborhood} mode="confirm" onapplied={() => (distanceOpen = false)} />
</Sheet>

<AiFab />

<style>
	.feed {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 20px;
		min-width: 0;
	}
	.filters {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.cats {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-right: auto;
	}
	.cat {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 38px;
		padding: 0 14px;
		border-radius: var(--pill);
		background: var(--surface);
		font-size: 14px;
		font-weight: 700;
		white-space: nowrap;
	}
	.cat.on {
		background: var(--accent);
		color: var(--white);
	}
	.distance-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 38px;
		padding: 0 14px;
		border: 1.5px solid var(--line);
		border-radius: var(--pill);
		background: var(--white);
		font-size: 14px;
		font-weight: 700;
		white-space: nowrap;
	}
	.distance-pill:hover {
		border-color: var(--ink);
	}
	.posts {
		display: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 28px 20px;
	}
	.mob-cat {
		display: none;
	}
	.more {
		justify-self: center;
	}
	.empty {
		display: grid;
		justify-items: start;
		gap: 12px;
		padding: 32px;
	}
	.empty h2 {
		font-size: 20px;
	}

	@media (max-width: 1023px) {
		.feed {
			gap: 12px;
		}
		.filters {
			padding: 0 12px;
		}
		.cats {
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
		}
		.filters > :global(:last-child),
		.distance-pill,
		.desk-menu {
			display: none;
		}
		.mob-cat {
			display: inline-flex;
		}
		.grid {
			display: none;
		}
		.posts {
			display: grid;
			gap: 14px;
			padding: 0 12px;
		}
		.empty {
			margin: 0 12px;
		}
	}
</style>
