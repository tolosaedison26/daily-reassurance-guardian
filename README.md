# Daily Guardian — Encrypted Backups

This branch contains encrypted backup files pushed automatically by the daily backup script.

## Files
- `latest-workflows.json.enc` — All n8n workflows (encrypted)
- `latest-db-export.json.enc` — Supabase DB export (encrypted, if configured)
- `backup-info.json` — Backup metadata (plaintext)

## Decrypt
```bash
openssl enc -aes-256-cbc -d -pbkdf2 -in latest-workflows.json.enc -out workflows.json
# Enter the password from /var/www/daily-guardian/backups/.backup-key on the VPS
```

## What's NOT here (local-only)
- n8n SQLite database (~89MB compressed) — stored at `/var/www/daily-guardian/backups/n8n/`
- Supabase DB is also covered by Pro plan PITR (7-day point-in-time recovery)
