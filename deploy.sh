#!/bin/bash
cd /var/www/daily-guardian
git pull origin main
npm install
npm run build
echo "✓ Deployed successfully"
