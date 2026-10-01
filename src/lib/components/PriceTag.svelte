<script lang="ts">
	import { formatBRL } from '$lib/utils/format';

	let { price }: { price: number } = $props();
</script>

<span class="tag"><span class="hole" aria-hidden="true"></span>{formatBRL(price)}</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px 6px 12px;
		border: 2.5px solid var(--ink);
		border-radius: 10px;
		background: var(--white);
		box-shadow: 3px 3px 0 var(--ink);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 20px;
		transform: rotate(4deg);
	}
	.hole {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid var(--ink);
	}
</style>
