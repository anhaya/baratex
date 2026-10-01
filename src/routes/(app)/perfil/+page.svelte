<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { rating } from '$lib/utils/format';

	let { data } = $props();
</script>

<svelte:head><title>baratex · Perfil</title></svelte:head>

<main class="page">
	<section class="card me">
		<Avatar name={data.viewer.name} size="l" tone="accent" />
		<div>
			<h1 class="display">{data.viewer.name}</h1>
			<p class="muted">@{data.viewer.handle} · {data.viewer.neighborhood} · {rating(data.viewer.rating)}</p>
		</div>
	</section>
	<nav class="card links" aria-label="Sua conta">
		<a href="/mensagens"><Icon name="message" />Mensagens</a>
		<a href="/vendas"><Icon name="sales" />Minhas vendas</a>
		<a href="/chat"><Icon name="sparkle" />Chat com IA</a>
		<a href="/descobrir"><Icon name="heart" />Modo descobrir</a>
	</nav>
	<p class="muted small">Login, endereço e pagamentos chegam com o backend. Por enquanto tudo aqui é simulado.</p>
</main>

<style>
	.page {
		display: grid;
		gap: 16px;
		max-width: 560px;
	}
	.me {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 20px;
	}
	h1 {
		font-size: 22px;
	}
	.links {
		display: grid;
		padding: 8px;
	}
	.links a {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 14px 12px;
		border-radius: var(--radius-s);
		font-weight: 700;
	}
	.links a:hover {
		background: var(--surface);
	}
	.small {
		font-size: 13px;
	}
	@media (max-width: 1023px) {
		.page {
			padding: 8px 12px;
		}
	}
</style>
