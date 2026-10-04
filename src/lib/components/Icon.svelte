<script lang="ts" module>
	// Stroke icons drawn on a 24px grid (shapes follow the Lucide set, ISC licence).
	const ICONS = {
		home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20h5v-6h4v6h5V9.5'],
		sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'],
		chat: ['M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.8A8 8 0 1 1 21 12z'],
		message: ['M4 5h16v11H9l-5 4z'],
		star: ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z'],
		bag: ['M6 8h12l-1 12H7z', 'M9 8V6a3 3 0 0 1 6 0v2'],
		sales: ['M3 7h11v9H3z', 'M14 10h4l3 3v3h-7', 'M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
		plus: ['M12 5v14', 'M5 12h14'],
		minus: ['M5 12h14'],
		pin: ['M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
		walk: ['M13 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M9 21l2.5-7 2.5 3v4', 'M8 11l3-4 3 2 3 1', 'M11.5 14 11 7'],
		bike: ['M5.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M18.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5.5 14.5 9 8h6l3.5 6.5', 'M12 14.5 9 8', 'M14 5h2l-1 3'],
		car: ['M5 16h14v-4l-2-5H7l-2 5z', 'M5 12h14', 'M7 16v2', 'M17 16v2', 'M8 14h.01', 'M16 14h.01'],
		truck: ['M2 6h12v10H2z', 'M14 9h4l4 4v3h-8', 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
		send: ['M21 3 10 14', 'M21 3l-7 18-4-7-7-4z'],
		'chevron-left': ['M15 18l-6-6 6-6'],
		'chevron-right': ['M9 6l6 6-6 6'],
		'chevron-down': ['M6 9l6 6 6-6'],
		heart: ['M12 20s-8-4.6-8-10.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.4 12 20 12 20z'],
		share: ['M12 3v12', 'M7 8l5-5 5 5', 'M5 13v7h14v-7'],
		shield: ['M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z', 'M9 12l2 2 4-4'],
		close: ['M6 6l12 12', 'M18 6 6 18'],
		camera: ['M4 8h3l2-3h6l2 3h3v11H4z', 'M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
		check: ['M5 12.5l4.5 4.5L19 7'],
		clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
		user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
		grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
		sofa: ['M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3', 'M2 12a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v6H2z', 'M5 18v2', 'M19 18v2'],
		shirt: ['M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z'],
		laptop: ['M5 5h14v10H5z', 'M2 19h20'],
		ball: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3.5 9.5c5 1.5 12 1.5 17 0', 'M3.5 14.5c5-1.5 12-1.5 17 0'],
		baby: ['M9 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M4 5h2l2 9h10l2-6H7'],
		music: ['M9 18V5l12-2v13', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
		search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
		tag: ['M3 3h8l10 10-8 8L3 11z', 'M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
		image: ['M4 5h16v14H4z', 'M4 16l5-5 4 4 2-2 5 5', 'M15.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z']
	} as const;

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		size?: number;
		filled?: boolean;
		label?: string;
		strokeWidth?: number;
	}

	let { name, size = 20, filled = false, label, strokeWidth = 1.8 }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	focusable="false"
>
	{#each ICONS[name] as d (d)}
		<path {d} />
	{/each}
</svg>
