#!/bin/bash

# Patrons Game Backup Script
# Creates timestamped backups of the game files

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="patrons_backup_$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create new backup folder
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Copy essential files
echo "📦 Creating backup: $BACKUP_NAME"

cp react-game.html "$BACKUP_DIR/$BACKUP_NAME/"
cp index.html "$BACKUP_DIR/$BACKUP_NAME/"

# Copy documentation
cp *.md "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null

# Create backup info
cat > "$BACKUP_DIR/$BACKUP_NAME/backup-info.txt" << EOF
Backup created: $(date)
Git status: $(git rev-parse --short HEAD 2>/dev/null || echo "No git")

Files included:
- react-game.html (main game file)
- index.html (entry point)
- All .md documentation files

To restore:
cp $BACKUP_DIR/$BACKUP_NAME/react-game.html ./
cp $BACKUP_DIR/$BACKUP_NAME/index.html ./
EOF

echo "✅ Backup complete: $BACKUP_DIR/$BACKUP_NAME"

# Keep only last 10 backups
cd "$BACKUP_DIR"
ls -t | tail -n +11 | xargs -I {} rm -rf {}
cd ..

echo "🧹 Old backups cleaned (keeping last 10)"

# Show backup size
du -sh "$BACKUP_DIR/$BACKUP_NAME"