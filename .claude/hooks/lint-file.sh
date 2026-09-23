#!/usr/bin/env bash
# PostToolUse hook: format and lint the one src/ file Claude just wrote.
# Nothing gates this repo, so `npm run lint` only ever runs if someone
# remembers to; this runs its three tools on the file while it's still the
# thing being worked on. Exit 2 hands the findings back to Claude.
set -u

root=$(cd "$(dirname "$0")/../.." && pwd)
file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
[ -n "$file" ] || exit 0

case "$file" in
"$root"/src/*) ;;
*) exit 0 ;;
esac

cd "$root" || exit 0
touch "$root/.claude/.check-pending"
npx prettier --write "$file" >/dev/null 2>&1

report=""

# A file in eslint's own `ignores` list is a usage error to eslint, not a
# clean result — it exits 2 with "No files matching the pattern".
case "$file" in
*.ts | *.js | *.svelte)
	out=$(npx eslint --no-warn-ignored "$file" 2>&1)
	status=$?
	case "$status:$out" in
	2:*"No files matching the pattern"*) ;;
	*) report="$out" ;;
	esac
	;;
esac

case "$file" in
*.css | *.svelte) report="$report$(npx stylelint "$file" 2>&1)" ;;
esac

[ -n "$(printf '%s' "$report" | tr -d '[:space:]')" ] || exit 0
printf '%s\n' "$report" >&2
exit 2
