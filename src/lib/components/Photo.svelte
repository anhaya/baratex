<script lang="ts">
	import type { Photo } from '$lib/api/schemas';
	import Icon from './Icon.svelte';

	interface Props {
		photo: Photo | undefined;
		/** Intrinsic size hint for layout stability; the image is square. */
		size?: number;
		eager?: boolean;
		fit?: 'contain' | 'cover';
		dim?: boolean;
	}
	let { photo, size = 447, eager = false, fit = 'contain', dim = false }: Props = $props();
</script>

{#if photo?.src}
	<img
		class="photo {fit}"
		class:dim
		src={photo.src}
		alt={photo.alt}
		width={size}
		height={size}
		loading={eager ? 'eager' : 'lazy'}
		fetchpriority={eager ? 'high' : 'auto'}
		decoding="async"
	/>
{:else}
	<div class="placeholder" class:dim role="img" aria-label={photo?.alt ?? 'Sem foto'}>
		<Icon name="image" size={28} />
	</div>
{/if}

<style>
	.photo {
		width: 100%;
		height: 100%;
		background: var(--white);
	}
	.contain {
		object-fit: contain;
	}
	.cover {
		object-fit: cover;
	}
	.placeholder {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		background: var(--placeholder);
		color: rgba(14, 14, 16, 0.25);
	}
	.dim {
		filter: grayscale(1);
		opacity: 0.6;
	}
</style>
