<script lang="ts">
	import Icon from './Icon.svelte';
</script>

<a href="/chat" class="fab-wrap" aria-label="Chat com IA: me diga o que precisa e eu acho pra você">
	<span class="bubble" aria-hidden="true">
		<strong>Procurando algo?</strong>
		<span>Me diga o que precisa e eu acho pra você.</span>
	</span>
	<span class="fab" aria-hidden="true">
		<Icon name="message" size={24} />
		<span class="spark"><Icon name="sparkle" size={12} /></span>
	</span>
</a>

<style>
	.fab-wrap {
		position: fixed;
		right: 24px;
		bottom: 32px;
		z-index: 25;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.bubble {
		display: grid;
		gap: 2px;
		max-width: 240px;
		padding: 12px 14px;
		border: 1.5px solid var(--line);
		border-radius: 14px;
		background: var(--white);
		box-shadow: var(--shadow-pop);
		font-size: 13px;
		color: var(--muted);
	}
	.bubble strong {
		color: var(--ink);
		font-size: 14px;
	}
	.fab {
		position: relative;
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: var(--accent);
		color: var(--white);
		box-shadow: var(--shadow-fab);
	}
	.spark {
		position: absolute;
		top: -4px;
		right: -4px;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--white);
		border: 2px solid var(--accent);
		color: var(--accent);
	}
	@media (max-width: 1023px) {
		.fab-wrap {
			right: 16px;
			bottom: calc(var(--bottom-nav-h) + 16px + env(safe-area-inset-bottom));
		}
		.bubble {
			display: none;
		}
	}
</style>
