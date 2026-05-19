#!/bin/bash
# AiCreatorFeed — one command deploy
# Usage: bash deploy.sh "your commit message"
# Example: bash deploy.sh "add auth pages"

MSG=${1:-"update $(date '+%Y-%m-%d %H:%M')"}

echo "🚀 Deploying AiCreatorFeed..."
echo "📝 Commit: $MSG"
echo ""

git add .
git commit -m "$MSG"
git push

echo ""
echo "✅ Done! Vercel will auto-deploy in ~2 minutes."
echo "🌐 Check: https://aicreatorfeed.vercel.app"
