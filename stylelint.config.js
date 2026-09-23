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
		// Svelte's :global(...) isn't part of the CSS spec postcss-html hands to
		// stylelint, so every use of it reads as an unknown pseudo-class.
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],

		// Flags `.foo:disabled` after `.foo:hover:not(:disabled)` as a specificity
		// trap. This codebase's pattern is near-universally two mutually exclusive
		// state pseudo-classes, which the rule can't tell from an ordering bug.
		'no-descending-specificity': null,

		// Conventions #2: every colour comes from a var(--color-...) token.
		// box-shadow is excluded because the plugin checks a declaration's whole
		// value, so a shadow mixing literal offsets with a tokenized colour would
		// be flagged alongside a genuinely hardcoded one.
		'scale-unlimited/declaration-strict-value': [
			['color', '/-color$/', 'fill', 'stroke'],
			{
				ignoreValues: ['transparent', 'currentColor', 'inherit', 'initial', 'unset', 'none'],
				ignoreFunctions: false,
				expandShorthand: true,
				recurseLonghand: true,
				message:
					"Use a var(--color-...) token from tokens.css instead of a literal color (Conventions #2). Add a new token there if one doesn't exist yet."
			}
		]
	}
};
