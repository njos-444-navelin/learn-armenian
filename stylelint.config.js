export default {
	plugins: ['stylelint-declaration-strict-value'],
	extends: ['stylelint-config-recommended'],
	overrides: [
		{
			// Extracts the <style> block out of a .svelte file so the rest of
			// this config can lint it as plain CSS.
			files: ['**/*.svelte'],
			customSyntax: 'postcss-html'
		}
	],
	// tokens.css is where the palette itself is defined — every hex/color-mix()
	// value in this file below is legitimate, not something for the
	// no-hardcoded-colors rule to flag.
	ignoreFiles: ['src/lib/styles/tokens.css'],
	rules: {
		// Svelte's own :global(...) selector modifier isn't part of the CSS
		// spec postcss-html hands to stylelint, so without this every single
		// use of it (there are several, for styling a child component from
		// its parent) reads as an unknown pseudo-class.
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],

		// Flags selectors like `.foo:disabled` appearing after
		// `.foo:hover:not(:disabled)` as a specificity trap — correct in
		// general, but this codebase's actual pattern is near-universally two
		// mutually exclusive state pseudo-classes (an element is never both
		// :disabled and :hover:not(:disabled) at once), which the rule can't
		// distinguish from a genuine ordering bug. High false-positive rate
		// for this codebase's style outweighs what it'd actually catch.
		'no-descending-specificity': null,

		// Conventions #2: every color must come from a var(--color-...)
		// token. box-shadow is deliberately excluded — this plugin checks a
		// declaration's whole value, and a box-shadow mixing literal
		// offsets with a var()-based color (e.g. `0 0 16px var(--color-x)`,
		// see Button.svelte's .glow) isn't a bare var() even though its
		// color is already correctly tokenized, so including it would flag
		// every well-behaved multi-part shadow right alongside a genuinely
		// hardcoded one.
		'scale-unlimited/declaration-strict-value': [
			['color', '/-color$/', 'fill', 'stroke'],
			{
				ignoreValues: ['transparent', 'currentColor', 'inherit', 'initial', 'unset', 'none'],
				ignoreFunctions: false,
				expandShorthand: true,
				recurseLonghand: true,
				message:
					'Use a var(--color-...) token from tokens.css instead of a literal color (Conventions #2). Add a new token there if one doesn\'t exist yet.'
			}
		]
	}
};
