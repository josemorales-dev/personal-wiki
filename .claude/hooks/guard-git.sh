#!/bin/bash
# PreToolUse hook: asks the user before Git commands that publish or destroy work.

command=$(jq -r '.tool_input.command // empty')

git='(^|[;&|(`[:space:]])git([[:space:]]+-[Cc][[:space:]]+[^[:space:]]+)*[[:space:]]+'
guarded=(
  "${git}push([[:space:]]|$)"
  "${git}reset[[:space:]].*--hard"
  "${git}clean[[:space:]]+(.*[[:space:]])?-[a-zA-Z]*f"
  "${git}branch[[:space:]]+(.*[[:space:]])?(-D|--delete[[:space:]]+--force|--force[[:space:]]+--delete)"
  "${git}checkout[[:space:]]+(--[[:space:]]+)?\.([[:space:]]|$)"
  "${git}restore[[:space:]]+(.*[[:space:]])?\.([[:space:]]|$)"
)

for pattern in "${guarded[@]}"; do
  if [[ "$command" =~ $pattern ]]; then
    jq -n --arg cmd "$command" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: ("Publishes or discards Git work: " + $cmd)
      }
    }'
    exit 0
  fi
done

exit 0
