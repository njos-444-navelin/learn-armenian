<script lang="ts">
	import type { Character } from '$lib/content/dialogues/types';
	import { t } from '$lib/i18n/current';

	interface Props {
		character: Character;
		/** `sm` (2.25rem) beside a dialogue line; `md` (3rem) where it stands on its own. */
		size?: 'sm' | 'md' | undefined;
	}

	let { character, size = 'sm' }: Props = $props();
</script>

<!-- Two hand-drawn faces from the Dialogues design, not photos: a bob of
     dark hair for Tereza, a shaved head for Dmitrii. Same 40x40 canvas and
     the same shoulders path for both, so they read as a matched pair. -->
<svg class="avatar {size}" viewBox="0 0 40 40" role="img" aria-label={t(character.name)}>
	{#if character.id === 'tereza'}
		<path
			class="hair"
			d="M8 22c0-9 4.2-13.5 12-13.5S32 13 32 22c0 5.5-.8 8.5-1.8 11H9.8C8.8 30.5 8 27.5 8 22z"
		/>
		<circle class="skin" cx="20" cy="20.5" r="8.4" />
		<path class="hair" d="M11.6 17.6C12.5 11.4 16 9 20 9s7.5 2.4 8.4 8.6c-2.6-2.2-5.2-3.1-8.4-3.1s-5.8.9-8.4 3.1z" />
		<circle class="ink" cx="17.2" cy="20.6" r="1" />
		<circle class="ink" cx="22.8" cy="20.6" r="1" />
		<path class="mouth" d="M18.3 25.1c1.1.8 2.3.8 3.4 0" />
	{:else}
		<circle class="skin" cx="11.3" cy="21" r="1.9" />
		<circle class="skin" cx="28.7" cy="21" r="1.9" />
		<circle class="skin" cx="20" cy="20" r="9" />
		<path class="stubble" d="M11.3 18.4C12.2 11.9 15.8 9.2 20 9.2s7.8 2.7 8.7 9.2c-2.7-1.7-5.5-2.4-8.7-2.4s-6 .7-8.7 2.4z" />
		<circle class="ink" cx="17" cy="20.4" r="1" />
		<circle class="ink" cx="23" cy="20.4" r="1" />
		<path class="mouth" d="M17.4 24.6c1.7 1.3 3.6 1 5-.7" />
	{/if}
	<path class="shoulders" d="M10.5 40c1.7-4.8 5.2-6.9 9.5-6.9s7.8 2.1 9.5 6.9z" />
</svg>

<style>
	/* The same soft ring every icon badge in a card gets; the fill is the
	   page's own cream so the face reads as a badge on the bubble's surface
	   (DESIGN.md's icon-badge rule). */
	.avatar {
		flex: none;
		border-radius: 50%;
		background: var(--color-background);
		box-shadow: 0 0 0 1.5px var(--color-border-soft);
	}

	.sm {
		width: 2.25rem;
		height: 2.25rem;
	}

	.md {
		width: 3rem;
		height: 3rem;
	}

	.hair,
	.ink {
		fill: var(--color-neutral-900);
	}

	.skin {
		fill: var(--color-accent-300);
	}

	.stubble {
		fill: var(--color-neutral-700);
	}

	.shoulders {
		fill: var(--color-neutral-800);
	}

	.mouth {
		fill: none;
		stroke: var(--color-neutral-900);
		stroke-width: 1.3;
		stroke-linecap: round;
	}
</style>
