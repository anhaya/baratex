<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { children } = $props();
	const showHeader = $derived(page.route.id === '/(focus)/anuncio/[id]');
</script>

{#if showHeader}
	<header class="top">
		<Logo />
		<div class="actions">
			<a href="/chat" class="btn btn-ghost"><Icon name="search" size={18} />Buscar</a>
			<a href="/vender" class="btn btn-primary"><Icon name="plus" size={18} strokeWidth={2.4} />Vender</a>
		</div>
	</header>
{/if}

{@render children()}

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--header-h);
		padding: 0 24px;
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(8px);
		border-bottom: 1.5px solid var(--line);
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	@media (max-width: 1023px) {
		.top {
			display: none;
		}
	}
</style>
