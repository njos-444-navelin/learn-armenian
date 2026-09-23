<script lang="ts">
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import type { DialogueRule } from '$lib/content/dialogues/types';
	import { t } from '$lib/i18n/current';
	import { hideRuleLabel, showRuleLabel } from '$lib/i18n/dictionaries/dialogues';

	interface Props {
		rule: DialogueRule;
	}

	let { rule }: Props = $props();
	let open = $state(false);
</script>

<section class="rule" class:open>
	<button
		type="button"
		class="toggle"
		aria-expanded={open}
		aria-controls="dialogue-rule-body"
		onclick={() => (open = !open)}
		use:blurAfterClick
	>
		<span class="icon">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
				width="18"
				height="18"
			>
				<path d="M12 7v14" />
				<path
					d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
				/>
			</svg>
		</span>
		<span class="copy">
			<span class="title">{t(rule.title)}</span>
			<span class="summary">{t(rule.summary)}</span>
		</span>
		<span class="cta">{open ? t(hideRuleLabel) : t(showRuleLabel)}</span>
	</button>

	<!-- Always in the DOM so its height can transition both ways (see the
	     .body rule below); `inert` keeps the collapsed text out of the tab
	     order and the accessibility tree, the way an {#if} would. -->
	<div class="body" class:open id="dialogue-rule-body" inert={!open}>
		<div class="body-inner">
			<p>{t(rule.intro)}</p>
			<dl class="examples">
				{#each rule.examples as example (example.armenian)}
					<dt lang="hy">{example.armenian}</dt>
					<dd class="translation">{t(example.translation)}</dd>
					<dd class="hint">{t(example.hint)}</dd>
				{/each}
			</dl>
			{#if rule.outro !== undefined}
				<p>{t(rule.outro)}</p>
			{/if}
			{#if rule.aside !== undefined}
				<p class="aside">{t(rule.aside)}</p>
			{/if}
		</div>
	</div>
</section>

<style>
	.rule {
		width: 100%;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		overflow: hidden;
		text-align: left;
	}

	.toggle {
		display: flex;
		width: 100%;
		align-items: center;
		gap: var(--space-3);
		/* Horizontal padding clears --radius-lg's corner curve on the leading
		   edge (DESIGN.md's padding-vs-radius note); the row is short enough
		   that the vertical padding can stay tighter. */
		padding: var(--space-3) var(--space-5);
		border: none;
		background: transparent;
		color: var(--color-text-primary);
		text-align: left;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.toggle:hover {
		background: var(--color-surface-hover);
	}

	.icon {
		display: grid;
		flex: none;
		place-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: var(--color-background);
		color: var(--color-accent-700);
	}

	.copy {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
	}

	.title {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
	}

	.summary {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.cta {
		flex: none;
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-sm);
		color: var(--color-accent-700);
	}

	/* `interpolate-size: allow-keywords` lets `height` animate to and from
	   `auto`, so there's no measured pixel height to keep in sync. Browsers
	   without it snap the height and still get the fade. Padding and the divider
	   live on .body-inner so the collapsed box is genuinely 0 tall, and closing
	   transitions too, hence a class toggle rather than an {#if}. */
	.body {
		height: 0;
		overflow: hidden;
		interpolate-size: allow-keywords;
		transition: height 260ms ease;
	}

	.body.open {
		height: auto;
	}

	.body-inner {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5) var(--space-5);
		border-top: 1px solid var(--color-border);
		opacity: 0;
		transition: opacity 160ms ease;
	}

	/* The text fades in a beat behind the box so it reads as arriving into
	   the space, not as flashing on while the box is still tiny. */
	.body.open .body-inner {
		opacity: 1;
		transition: opacity 200ms ease 90ms;
	}

	.examples {
		display: grid;
		grid-template-columns: auto max-content 1fr;
		gap: var(--space-2) var(--space-3);
		align-items: baseline;
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		background: var(--color-background);
	}

	.examples dt {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		white-space: nowrap;
	}

	.examples dd {
		margin: 0;
		color: var(--color-text-secondary);
	}

	.examples .hint {
		font-size: var(--font-size-sm);
	}

	.aside {
		padding-left: var(--space-3);
		border-left: 2px solid var(--color-accent-400);
		color: var(--color-text-secondary);
	}
</style>
