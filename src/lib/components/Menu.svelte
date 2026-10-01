<script lang="ts">
	import type { Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import Icon from './Icon.svelte';

	interface Props {
		label: string;
		variant?: 'dashed' | 'plain' | 'active';
		align?: 'start' | 'end';
		children: Snippet;
	}
	let { label, variant = 'plain', align = 'start', children }: Props = $props();
	let details: HTMLDetailsElement | undefined = $state();

	// Works without JavaScript (native <details>); with it, close on outside click and after navigating.
	afterNavigate(() => details?.removeAttribute('open'));
	function onwindowclick(event: MouseEvent) {
		if (details?.open && !details.contains(event.target as Node)) details.open = false;
	}
	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && details?.open) {
			details.open = false;
			details.querySelector('summary')?.focus();
		}
	}
</script>

<svelte:window onclick={onwindowclick} {onkeydown} />

<details bind:this={details} class="menu {variant}">
	<summary>{label}<Icon name="chevron-down" size={14} /></summary>
	<div class="list {align}" role="menu">
		{@render children()}
	</div>
</details>

<style>
	.menu {
		position: relative;
		flex: none;
	}
	summary {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 38px;
		padding: 0 14px;
		border-radius: var(--pill);
		font-size: 14px;
		font-weight: 700;
		white-space: nowrap;
		list-style: none;
		cursor: pointer;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.dashed summary {
		border: 1.5px dashed var(--line-2);
		background: var(--white);
	}
	.active summary {
		background: var(--accent);
		color: var(--white);
	}
	.plain summary {
		padding: 0 4px;
	}
	.list {
		position: absolute;
		z-index: 40;
		top: calc(100% + 6px);
		min-width: 200px;
		display: grid;
		padding: 6px;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--white);
		box-shadow: var(--shadow-pop);
	}
	.start {
		left: 0;
	}
	.end {
		right: 0;
	}
	.list :global(a) {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
	}
	.list :global(a:hover),
	.list :global(a[aria-current='true']) {
		background: var(--surface);
	}
</style>
