// Encodes docs/CONVENTIONS.md #14: app.css gives every element an
// always-present, transparent outline plus `transition: outline-color
// var(--transition-fast)` on `*`, so :focus-visible fades in/out instead of
// flashing. But `transition` isn't additive across rules — whichever rule
// wins the cascade for an element supplies its *entire* list, not a merge
// with `*`'s — so any component-level `transition`/`transition-property`
// declaration silently drops that fade for its element unless it lists
// `outline-color` itself too.
//
// This can't distinguish a focusable element's transition from a purely
// decorative one (that requires knowing the markup, which a CSS-only rule
// can't see) — so it flags every `transition`/`transition-property`
// declaration that names specific properties, on the assumption that a false
// positive on a genuinely non-focusable element (fix: a disable comment
// explaining why, same as any other lint exception) is far cheaper than a
// false negative that silently reintroduces this bug on a new focusable one.

import stylelint from 'stylelint';

const { createPlugin, utils } = stylelint;

const ruleName = 'local/transition-includes-outline-color';

const messages = utils.ruleMessages(ruleName, {
	rejected: (prop) =>
		`"${prop}" doesn't include outline-color, so :focus-visible's ring will snap instead of fading on this element (Conventions #14). Add "outline-color var(--transition-fast)" to the list, or disable this rule with a comment if the element can never receive focus.`
});

const meta = {
	url: 'https://github.com/anthropics/learn-armenian/blob/main/docs/CONVENTIONS.md#14-a-components-own-transition-list-must-include-outline-color'
};

/** True for a transition value that already covers every property (`all`)
 * or transitions nothing (`none`) — outline-color is either already
 * included or moot. */
function coversEverythingOrNothing(value) {
	return /(^|,)\s*(all|none)\s*(,|$)/i.test(value);
}

const ruleFunction = (primary) => {
	return (root, result) => {
		const validOptions = utils.validateOptions(result, ruleName, {
			actual: primary,
			possible: [true, false]
		});
		if (!validOptions || !primary) return;

		root.walkDecls(/^transition(-property)?$/, (decl) => {
			if (coversEverythingOrNothing(decl.value)) return;
			if (/outline-color/i.test(decl.value)) return;

			utils.report({
				message: messages.rejected(decl.prop),
				node: decl,
				result,
				ruleName
			});
		});
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default createPlugin(ruleName, ruleFunction);
