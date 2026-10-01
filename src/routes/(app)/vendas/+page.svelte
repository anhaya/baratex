<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import ListingTile from '$lib/components/ListingTile.svelte';

	let { data } = $props();
</script>

<svelte:head><title>baratex · Minhas vendas</title></svelte:head>

<main class="page">
	<header>
		<h1 class="display">Minhas vendas</h1>
		<a class="btn btn-primary" href="/vender"><Icon name="plus" size={18} strokeWidth={2.4} />Anunciar peça</a>
	</header>
	{#if data.listings.length === 0}
		<p class="muted">Você ainda não anunciou nada. Leva menos de um minuto: tire fotos e a gente preenche o resto.</p>
	{:else}
		<div class="grid">
			{#each data.listings as listing (listing.id)}
				<ListingTile {listing} />
			{/each}
		</div>
	{/if}
</main>

<style>
	.page {
		display: grid;
		gap: 20px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	h1 {
		font-size: 30px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 16px;
	}
	@media (max-width: 1023px) {
		.page {
			padding: 8px 12px;
		}
		h1 {
			font-size: 24px;
		}
	}
</style>
