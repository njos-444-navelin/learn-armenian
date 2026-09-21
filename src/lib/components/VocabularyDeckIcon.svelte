<script lang="ts">
	import type { VocabularyDeckIconId } from '$lib/content/vocabulary/types';

	interface Props {
		icon: VocabularyDeckIconId;
		/** `sm` (48px) for a deck-list row, `lg` (72px) for the deck page's own
		 * hero. */
		size?: 'sm' | 'lg' | undefined;
		/** `filled` (solid terracotta, cream glyph) marks a deck in the
		 * learner's collection; `muted` (warm sand, ink glyph) marks one they
		 * haven't added. Unlike the generic "icon-badge inside a card" rule in
		 * docs/DESIGN.md (which wants a plain `--color-background` fill for a
		 * badge with no meaning of its own), this badge's fill *is* the
		 * meaning — collection membership — so it earns its own tint per the
		 * "reserve tinted backgrounds for small elements" exception. */
		variant?: 'filled' | 'muted' | undefined;
	}

	let { icon, size = 'sm', variant = 'filled' }: Props = $props();
	let glyphSize = $derived(size === 'lg' ? 34 : 22);
</script>

<span class="badge {size} {variant}" aria-hidden="true">
	{#if icon === 'hand'}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			width={glyphSize}
			height={glyphSize}
		>
			<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
			<path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
			<path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
			<path
				d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
			/>
		</svg>
	{:else if icon === 'people'}
		<!-- Two figures, the second half behind the first — hand-drawn in the
		     spirit of Lucide's `users`, not its path data (see docs/DESIGN.md,
		     Icons, on provenance). -->
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			width={glyphSize}
			height={glyphSize}
		>
			<circle cx="9" cy="7.5" r="3.5" />
			<path d="M2.5 21v-1.5a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5V21" />
			<path d="M16 4.3a3.5 3.5 0 0 1 0 6.4" />
			<path d="M21.5 21v-1.5a5 5 0 0 0-3.5-4.77" />
		</svg>
	{:else if icon === 'person'}
		<!-- One figure, the `people` glyph's front person on its own — the
		     pronouns deck is "I, you, he"; same family as `people` so the two
		     read as a pair in the deck list. -->
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			width={glyphSize}
			height={glyphSize}
		>
			<circle cx="12" cy="7.5" r="3.5" />
			<path d="M4.5 21v-1.5a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5V21" />
		</svg>
	{:else if icon === 'basket'}
		<!-- A shopping basket: rim, tapering body, and a handle arching over
		     it — the food deck is a shopping list. Hand-drawn in the spirit
		     of Lucide's `shopping-basket`, not its path data (see
		     docs/DESIGN.md, Icons, on provenance). -->
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			width={glyphSize}
			height={glyphSize}
		>
			<path d="M3 10.5h18" />
			<path d="M5 10.5l1.5 9.2a1.6 1.6 0 0 0 1.6 1.3h7.8a1.6 1.6 0 0 0 1.6-1.3L19 10.5" />
			<path d="M8 10.5l4-7 4 7" />
		</svg>
	{:else}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			width={glyphSize}
			height={glyphSize}
		>
			<path
				d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
			/>
		</svg>
	{/if}
</span>

<style>
	.badge {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.badge.sm {
		width: 3rem;
		height: 3rem;
	}

	.badge.lg {
		width: 4.5rem;
		height: 4.5rem;
	}

	.badge.filled {
		background: var(--color-accent-700);
		color: var(--color-accent-100);
	}

	.badge.muted {
		background: var(--color-neutral-300);
		color: var(--color-neutral-800);
	}
</style>
