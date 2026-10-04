<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { Comment, User } from '$lib/api/schemas';
	import type { ListingWithSeller } from '$lib/api/types';
	import { stayOnPage } from '$lib/forms';
	import { timeAgo } from '$lib/utils/format';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import Sheet from './Sheet.svelte';

	interface Props {
		open: boolean;
		item: ListingWithSeller;
		people: Record<string, User>;
		viewer: User;
	}
	let { open = $bindable(), item, people, viewer }: Props = $props();

	const listing = $derived(item.listing);
	const href = $derived(`/anuncio/${listing.id}`);
	const author = (c: Comment) => (c.authorId === viewer.id ? 'Você' : (people[c.authorId]?.name ?? 'Alguém'));

	let replyTo = $state<Comment | null>(null);
	let error = $state('');
	let input: HTMLInputElement | undefined = $state();

	function reply(c: Comment) {
		replyTo = c;
		input?.focus();
	}
</script>

<Sheet bind:open title="Comentários">
	<p class="about"><strong>{listing.title}</strong> · <a {href}>ver anúncio</a></p>

	{#if listing.comments.length === 0}
		<p class="empty">Ninguém comentou ainda. Pergunte algo pra {item.seller.name}!</p>
	{:else}
		<ul class="list">
			{#each listing.comments as c (c.id)}
				<li class:reply={!!c.replyTo}>
					<Avatar name={author(c)} size="s" tone={c.authorId === viewer.id ? 'accent' : 'soft'} />
					<div>
						<div class="bubble">
							<strong>{author(c)}</strong>
							{#if c.authorId === item.seller.id}<span class="badge">Vendedor(a)</span>{/if}
							<span>{c.text}</span>
						</div>
						<span class="when">{timeAgo(c.createdAt)} · <button type="button" onclick={() => reply(c)}>Responder</button></span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<form
		class="add"
		method="POST"
		action="{href}?/comment"
		use:enhance={stayOnPage({
			after: (ok) => {
				error = ok ? '' : 'Não foi possível comentar';
				if (ok) replyTo = null;
			}
		})}
	>
		<input type="hidden" name="back" value={page.url.pathname + page.url.search} />
		<input type="hidden" name="replyTo" value={replyTo?.id ?? ''} />
		{#if replyTo}
			<span class="replying">
				Respondendo {author(replyTo)}
				<button type="button" aria-label="Cancelar resposta" onclick={() => (replyTo = null)}><Icon name="close" size={14} /></button>
			</span>
		{/if}
		<div class="row">
			<label class="visually-hidden" for="sheet-comment-{listing.id}">Escreva um comentário</label>
			<input
				bind:this={input}
				id="sheet-comment-{listing.id}"
				name="text"
				class="field"
				placeholder="Escreva um comentário…"
				maxlength="500"
				required
				autocomplete="off"
			/>
			<button class="icon-btn send" aria-label="Enviar comentário"><Icon name="send" size={18} /></button>
		</div>
		{#if error}<span class="error-text" role="alert">{error}</span>{/if}
	</form>
</Sheet>

<style>
	.about {
		margin: -8px 0 0;
		font-size: 14px;
		color: var(--muted);
	}
	.about strong {
		color: var(--ink);
	}
	.about a {
		color: var(--accent);
		font-weight: 700;
	}
	.empty {
		padding: 16px 0;
		color: var(--muted);
		font-size: 14px;
	}
	.list {
		display: grid;
		gap: 12px;
		max-height: min(50vh, 420px);
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.list li {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.list li.reply {
		margin-left: 38px;
	}
	.bubble {
		display: grid;
		gap: 2px;
		padding: 10px 14px;
		border-radius: 14px;
		background: var(--surface);
		font-size: 14px;
	}
	.bubble .badge {
		justify-self: start;
	}
	.when {
		display: block;
		margin: 4px 0 0 12px;
		font-size: 12px;
		color: var(--muted);
	}
	.when button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--ink);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
	.add {
		display: grid;
		gap: 6px;
	}
	.row {
		display: flex;
		gap: 8px;
	}
	.row .field {
		flex: 1;
		min-height: 42px;
		border-radius: var(--pill);
		background: var(--surface-2);
	}
	.send {
		flex: none;
		background: var(--accent);
		border-color: var(--accent);
		color: var(--white);
	}
	.replying {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 700;
		color: var(--accent-ink);
	}
	.replying button {
		display: inline-grid;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		cursor: pointer;
	}
</style>
