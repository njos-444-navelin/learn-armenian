#!/usr/bin/env bash
# Stop hook: svelte-check over the project (~5s), the repo's other automated
# check. Only runs when lint-file.sh saw a src/ edit this session, so a turn
# that changed nothing doesn't pay for it. Exit 2 hands the errors back to
# Claude; stop_hook_active keeps that from looping.
set -u

root=$(cd "$(dirname "$0")/../.." && pwd)
pending="$root/.claude/.check-pending"

[ "$(jq -r '.stop_hook_active // false')" = "true" ] && exit 0
[ -f "$pending" ] || exit 0
rm -f "$pending"

cd "$root" || exit 0
if out=$(npm run check 2>&1); then
	exit 0
fi
printf '%s\n' "$out" >&2
exit 2
