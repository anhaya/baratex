<script lang="ts">
	import { initial } from '$lib/utils/format';

	interface Props {
		name: string;
		size?: 'xs' | 's' | 'm' | 'l';
		tone?: 'outline' | 'soft' | 'accent';
	}
	let { name, size = 'm', tone = 'outline' }: Props = $props();
</script>

<span class="avatar {size} {tone}" aria-hidden="true">{initial(name)}</span>

<style>
	.avatar {
		display: inline-grid;
		place-items: center;
		flex: none;
		border-radius: 50%;
		font-family: var(--font-display);
		font-weight: 700;
		background: var(--surface);
		color: var(--ink);
	}
	.outline {
		border: 2px solid var(--ink);
		background: var(--white);
	}
	.soft {
		background: var(--surface);
	}
	.accent {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.xs {
		width: 24px;
		height: 24px;
		font-size: 10px;
	}
	.s {
		width: 30px;
		height: 30px;
		font-size: 12px;
	}
	.m {
		width: 42px;
		height: 42px;
		font-size: 17px;
	}
	.l {
		width: 48px;
		height: 48px;
		font-size: 18px;
	}
</style>
