<script lang="ts">
	import { page } from '$app/state';
	import type { Counts, } from '$lib/api/types';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';

	let { counts, viewerName }: { counts: Counts; viewerName: string } = $props();
	const is = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
</script>

<nav class="bottom" aria-label="Principal">
	<a href="/" class:active={is('/')} aria-current={is('/') ? 'page' : undefined}>
		<Icon name="home" size={22} filled={is('/')} />Feed
	</a>
	<a href="/favoritos" class:active={is('/favoritos')} aria-current={is('/favoritos') ? 'page' : undefined}>
		<Icon name="star" size={22} filled={is('/favoritos')} />Favoritos
	</a>
	<a href="/vender" class="sell" aria-label="Vender">
		<span><Icon name="plus" size={26} strokeWidth={2.4} /></span>
	</a>
	<a href="/sacola" class:active={is('/sacola')} aria-current={is('/sacola') ? 'page' : undefined}>
		<span class="with-count">
			<Icon name="bag" size={22} />
			{#if counts.cart > 0}<span class="dot">{counts.cart}</span>{/if}
		</span>Sacola
	</a>
	<a href="/perfil" class:active={is('/perfil')} aria-current={is('/perfil') ? 'page' : undefined}>
		<Avatar name={viewerName} size="xs" tone="soft" />Perfil
	</a>
</nav>

<style>
	.bottom {
		position: fixed;
		inset: auto 0 0 0;
		z-index: 30;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		align-items: center;
		height: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: var(--white);
		border-top: 1.5px solid var(--line);
	}
	a {
		display: grid;
		justify-items: center;
		gap: 4px;
		font-size: 12px;
		font-weight: 600;
		color: var(--muted);
	}
	a.active {
		color: var(--ink);
		font-weight: 800;
	}
	.sell span {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: var(--accent-light);
		border: 2.5px solid var(--ink);
		color: var(--ink);
	}
	.with-count {
		position: relative;
	}
	.dot {
		position: absolute;
		top: -6px;
		right: -10px;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		border-radius: var(--pill);
		background: var(--danger);
		color: var(--white);
		font-size: 11px;
		display: grid;
		place-items: center;
	}
</style>
