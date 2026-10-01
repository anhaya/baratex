<script lang="ts">
	import { page } from '$app/state';
	import type { Counts } from '$lib/api/types';
	import Icon, { type IconName } from './Icon.svelte';

	let { counts }: { counts: Counts } = $props();

	const items: { href: string; label: string; icon: IconName; extra?: 'ai' | 'messages' | 'favorites' }[] = [
		{ href: '/', label: 'Feed', icon: 'home' },
		{ href: '/chat', label: 'Chat com IA', icon: 'sparkle', extra: 'ai' },
		{ href: '/mensagens', label: 'Mensagens', icon: 'message', extra: 'messages' },
		{ href: '/favoritos', label: 'Favoritos', icon: 'star', extra: 'favorites' },
		{ href: '/sacola', label: 'Minha sacola', icon: 'bag' },
		{ href: '/vendas', label: 'Minhas vendas', icon: 'sales' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<nav aria-label="Principal">
	<ul>
		{#each items as item (item.href)}
			<li>
				<a href={item.href} class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
					<span class="ico"><Icon name={item.icon} size={18} /></span>
					<span class="label">{item.label}</span>
					{#if item.extra === 'ai'}
						<span class="badge">IA</span>
					{:else if item.extra === 'messages' && counts.unreadMessages > 0}
						<span class="count danger" aria-label="{counts.unreadMessages} não lidas">{counts.unreadMessages}</span>
					{:else if item.extra === 'favorites'}
						<span class="count plain">{counts.favorites}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	a {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		border-radius: var(--radius-m);
		font-weight: 600;
		font-size: 15px;
	}
	a:hover {
		background: var(--surface-2);
	}
	.ico {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: var(--surface);
	}
	.label {
		flex: 1;
	}
	.active {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 800;
	}
	.active:hover {
		background: var(--accent-soft);
	}
	.active .ico {
		background: var(--accent);
		color: var(--white);
	}
	.count {
		font-size: 12px;
		font-weight: 700;
	}
	.danger {
		display: grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border-radius: var(--pill);
		background: var(--danger);
		color: var(--white);
	}
	.plain {
		color: var(--ink-3);
	}
</style>
