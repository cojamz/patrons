#!/bin/bash
# PreToolUse Hook: Verify implementation plan exists before coding
#
# This hook prevents coding without an approved plan by checking for
# the existence of implementation_plan.md before allowing file writes/edits.
#
# Hook will only run for Edit and Write tools on implementation files
# (not documentation, config, or state tracking files)

# Get the tool being used and its arguments from hook environment
TOOL_NAME="${TOOL_NAME:-}"
TOOL_ARGS="${TOOL_ARGS:-}"

# Only check for Edit and Write operations
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
    exit 0  # Allow other tools without checks
fi

# Parse the file path from tool arguments (it's in JSON format)
FILE_PATH=$(echo "$TOOL_ARGS" | grep -o '"file_path":"[^"]*"' | cut -d'"' -f4)

# Skip checks for these file types (they're meta/documentation files)
SKIP_PATTERNS=(
    "CLAUDE.md"
    "DEVELOPMENT_META_FRAMEWORK.md"
    "README.md"
    "implementation_state.md"
    "implementation_plan.md"
    ".claude/hooks/"
    ".claude/commands/"
    ".gitignore"
    "package.json"
)

# Check if file should skip plan verification
for pattern in "${SKIP_PATTERNS[@]}"; do
    if [[ "$FILE_PATH" == *"$pattern"* ]]; then
        exit 0  # Skip check for meta/doc files
    fi
done

# Now check if implementation_plan.md exists
PLAN_FILE="/Users/cory/Cursor Projects/Patrons/.claude/implementation_plan.md"

if [[ ! -f "$PLAN_FILE" ]]; then
    echo ""
    echo "⚠️  PLAN REQUIRED: No implementation_plan.md found!"
    echo ""
    echo "Before coding, you must:"
    echo "  1. Run /plan to create an implementation plan"
    echo "  2. Get user approval of the plan"
    echo "  3. Then proceed with /step commands"
    echo ""
    echo "This ensures we don't code without thinking first."
    echo ""
    exit 1  # Block the operation
fi

# Check if state file exists
STATE_FILE="/Users/cory/Cursor Projects/Patrons/.claude/implementation_state.md"

if [[ ! -f "$STATE_FILE" ]]; then
    echo ""
    echo "⚠️  STATE FILE MISSING: No implementation_state.md found!"
    echo ""
    echo "The state file should exist before coding."
    echo "It should have been created when you ran /plan."
    echo ""
    exit 1  # Block the operation
fi

# All checks passed
exit 0
