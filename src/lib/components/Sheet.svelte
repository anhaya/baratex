<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
	}
	let { open = $bindable(), title, children }: Props = $props();
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function onclick(event: MouseEvent) {
		// Clicking the backdrop closes the sheet.
		if (event.target === dialog) open = false;
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} {onclick} aria-labelledby="sheet-title">
	<div class="sheet">
		<span class="grip" aria-hidden="true"></span>
		<header>
			<h2 id="sheet-title" class="display">{title}</h2>
			<button type="button" class="icon-btn close" aria-label="Fechar" onclick={() => (open = false)}>
				<Icon name="close" size={18} />
			</button>
		</header>
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		width: 100%;
		max-width: 560px;
		margin: auto auto 0;
		padding: 0;
		border: 0;
		border-radius: 28px 28px 0 0;
		background: var(--white);
		color: var(--ink);
	}
	dialog::backdrop {
		background: rgba(14, 14, 16, 0.5);
	}
	@media (min-width: 640px) {
		dialog {
			margin: auto;
			border-radius: 28px;
		}
	}
	.sheet {
		display: grid;
		gap: 16px;
		padding: 12px 16px calc(20px + env(safe-area-inset-bottom));
	}
	.grip {
		justify-self: center;
		width: 40px;
		height: 5px;
		border-radius: var(--pill);
		background: var(--line-2);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h2 {
		font-size: 19px;
	}
	.close {
		width: 34px;
		height: 34px;
	}
</style>
