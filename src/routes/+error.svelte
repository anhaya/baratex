<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
</script>

<svelte:head><title>{page.status} · baratex</title></svelte:head>

<main class="error">
	<Logo />
	<h1 class="display">{page.status === 404 ? 'Não achamos essa página' : 'Algo deu errado'}</h1>
	<p class="muted">{page.error?.message}</p>
	<a class="btn btn-primary" href="/">Voltar para o feed</a>
</main>

<style>
	.error {
		display: grid;
		justify-items: center;
		gap: 16px;
		padding: 96px 16px;
		text-align: center;
	}
	h1 {
		font-size: 28px;
	}
</style>
