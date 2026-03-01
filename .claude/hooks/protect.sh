#!/bin/bash
# Safety hook: Protects critical files and blocks destructive operations
# Used by PreToolUse hooks configured in .claude/settings.json
#
# Input: JSON on stdin with tool_input fields
# Exit 0: Allow operation
# Exit 2: Block operation (stderr message shown to Claude)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# --- Protect critical files (Edit/Write) ---
if [[ "$TOOL_NAME" == "Edit" || "$TOOL_NAME" == "Write" ]]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

  # Protected file patterns
  if [[ "$FILE_PATH" == *".env"* ]]; then
    echo "BLOCKED: .env files are protected. These contain secrets." >&2
    exit 2
  fi
  if [[ "$FILE_PATH" == *"firebase-compat.js" ]]; then
    echo "BLOCKED: firebase-compat.js contains Firebase credentials. Edit manually if needed." >&2
    exit 2
  fi
  if [[ "$FILE_PATH" == *"package-lock.json" ]]; then
    echo "BLOCKED: package-lock.json should only be modified by npm. Run npm install instead." >&2
    exit 2
  fi
fi

# --- Block destructive bash commands ---
if [[ "$TOOL_NAME" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

  if echo "$COMMAND" | grep -qE 'rm\s+-rf\s'; then
    echo "BLOCKED: rm -rf is not allowed. Remove specific files instead." >&2
    exit 2
  fi
  if echo "$COMMAND" | grep -qE 'git\s+push\s+(-f|--force)'; then
    echo "BLOCKED: Force push is not allowed. Use regular push." >&2
    exit 2
  fi
  if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
    echo "BLOCKED: git reset --hard is destructive. Use git stash or git checkout <file> instead." >&2
    exit 2
  fi
  if echo "$COMMAND" | grep -qE 'git\s+checkout\s+\.$'; then
    echo "BLOCKED: git checkout . discards all changes. Use git stash or revert specific files." >&2
    exit 2
  fi
  if echo "$COMMAND" | grep -qE 'git\s+clean\s+-f'; then
    echo "BLOCKED: git clean -f permanently deletes untracked files. Remove specific files instead." >&2
    exit 2
  fi
fi

# Allow everything else
exit 0
