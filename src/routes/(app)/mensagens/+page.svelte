<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import Photo from '$lib/components/Photo.svelte';
	import { formatBRL, timeAgo } from '$lib/utils/format';

	let { data } = $props();

	function preview(m: (typeof data.conversations)[number]['conversation']['messages'][number] | undefined, viewerId: string) {
		if (!m) return 'Sem mensagens';
		const who = m.authorId === viewerId ? 'Você: ' : '';
		return m.kind === 'text' ? `${who}${m.text}` : `${who}oferta de ${formatBRL(m.amount)}`;
	}
</script>

<svelte:head><title>baratex · Mensagens</title></svelte:head>

<main class="page">
	<h1 class="display">Mensagens</h1>
	{#if data.conversations.length === 0}
		<p class="muted">Nenhuma conversa ainda. Faça uma oferta ou pergunta num anúncio.</p>
	{:else}
		<ul class="list">
			{#each data.conversations as { conversation, listing, other } (conversation.id)}
				{@const lastMessage = conversation.messages.at(-1)}
				<li>
					<a href="/mensagens/{conversation.id}" class="row" class:unread={conversation.unread > 0}>
						<span class="thumb"><Photo photo={listing.photos[0]} size={64} /></span>
						<span class="body">
							<span class="top">
								<strong>{other.name}</strong>
								<span class="muted when">{lastMessage ? timeAgo(lastMessage.createdAt) : ''}</span>
							</span>
							<span class="title">{listing.title}</span>
							<span class="muted preview">{preview(lastMessage, data.viewer.id)}</span>
						</span>
						{#if conversation.unread > 0}<span class="dot" aria-label="{conversation.unread} não lida"></span>{/if}
						<span class="avatar"><Avatar name={other.name} size="s" tone="soft" /></span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	.page {
		display: grid;
		gap: 20px;
		max-width: 760px;
	}
	h1 {
		font-size: 30px;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 8px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-l);
	}
	.row:hover {
		border-color: var(--ink);
	}
	.thumb {
		flex: none;
		width: 64px;
		height: 64px;
		border-radius: 14px;
		overflow: hidden;
		border: 1.5px solid var(--line);
	}
	.body {
		flex: 1;
		display: grid;
		min-width: 0;
		gap: 2px;
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.when {
		font-size: 12px;
	}
	.title {
		font-size: 13px;
		font-weight: 700;
	}
	.preview {
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.unread .preview {
		color: var(--ink);
		font-weight: 700;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--danger);
	}
	.avatar {
		display: none;
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
