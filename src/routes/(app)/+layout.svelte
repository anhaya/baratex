<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import DistancePicker from '$lib/components/DistancePicker.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import SideNav from '$lib/components/SideNav.svelte';

	let { data, children } = $props();

	// Screens that take over the whole phone (they have their own top bar).
	const immersive = $derived(
		page.route.id === '/(app)/chat' || page.route.id === '/(app)/mensagens/[id]'
	);
	let distanceOpen = $state(false);
</script>

<header class="top">
	<Logo />
	<a href="/vender" class="btn btn-primary sell-desktop"><Icon name="plus" size={18} strokeWidth={2.4} />Vender</a>
</header>

{#if !immersive}
	<header class="mobile-top mobile-only">
		<Logo />
		<div class="mobile-actions">
			<button type="button" class="radius-pill" onclick={() => (distanceOpen = true)} aria-haspopup="dialog">
				<Icon name="pin" size={18} />
				{data.radiusKm === null ? 'Entrega' : `${data.radiusKm} km`}
			</button>
			<a href="/mensagens" class="msg" aria-label="Mensagens, {data.counts.unreadMessages} não lidas">
				<Icon name="message" size={20} />
				{#if data.counts.unreadMessages > 0}<span class="unread" aria-hidden="true"></span>{/if}
			</a>
		</div>
	</header>
	<Sheet bind:open={distanceOpen} title="Até onde você vai buscar?">
		<DistancePicker
			radiusKm={data.radiusKm}
			neighborhood={data.viewer.neighborhood}
			mode="confirm"
			onapplied={() => (distanceOpen = false)}
		/>
	</Sheet>
{/if}

<div class="shell" class:immersive>
	<aside class="side">
		<SideNav counts={data.counts} />
	</aside>
	<div class="content">
		{@render children()}
	</div>
</div>

{#if !immersive}
	<div class="mobile-only">
		<BottomNav counts={data.counts} viewerName={data.viewer.name} />
	</div>
{/if}

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
	.shell {
		display: grid;
		grid-template-columns: 264px minmax(0, 1fr);
		gap: 24px;
		max-width: 1440px;
		margin: 0 auto;
		padding: 24px 24px 64px;
	}
	.side {
		position: sticky;
		top: calc(var(--header-h) + 24px);
		align-self: start;
	}
	.content {
		min-width: 0;
	}
	.mobile-only {
		display: none;
	}
	.mobile-top {
		position: sticky;
		top: 0;
		z-index: 20;
		align-items: center;
		justify-content: space-between;
		height: 64px;
		padding: 0 16px;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(8px);
	}
	.mobile-actions {
		display: flex;
		gap: 8px;
	}
	.radius-pill,
	.msg {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 40px;
		padding: 0 14px;
		border: 0;
		border-radius: var(--pill);
		background: var(--surface);
		font-weight: 800;
		font-size: 14px;
	}
	.msg {
		width: 40px;
		padding: 0;
		justify-content: center;
	}
	.unread {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--danger);
	}

	@media (max-width: 1023px) {
		.shell {
			grid-template-columns: minmax(0, 1fr);
			padding: 0 0 calc(var(--bottom-nav-h) + 24px);
		}
		.shell.immersive {
			padding: 0;
		}
		.side,
		.sell-desktop {
			display: none;
		}
		.top {
			display: none;
		}
		.mobile-only {
			display: block;
		}
		.mobile-top {
			display: flex;
		}
	}
</style>
