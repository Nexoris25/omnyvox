# Storage and local AI operations

## Database and workers

Back up PostgreSQL and the encryption keys first. For an existing database run `npm run db:migrate`; fresh installations use `npm run db:setup`. Migrations use a ledger and advisory lock and can be rerun safely. Test restoration before production changes.

Schedule `npm run worker:maintenance` every minute for eligible scheduled content and delayed media cleanup. Schedule `node --env-file=.env.local scripts/send-email.mjs` every minute for bounded email retries. These are one-shot workers; use the VPS service manager with the application environment, restricted service account, logs and failure alerts. Failed email remains visible; configure Resend and a verified EMAIL_FROM before publishing.

## Moving VPS media to Bunny Storage

1. Set and securely back up STORAGE_ENCRYPTION_KEY (64 hexadecimal characters). ENCRYPTION_KEY is the fallback. Do not replace an encryption key without re-encrypting existing secrets; that rotation is not automated.
2. In internal administration, open storage, enter the storage-zone name, supported regional hostname and the zone's storage password. Use the Storage HTTP API password, not the account API key.
3. Run the connection test. It writes, reads and removes a temporary object. Activate the tested destination for new uploads.
4. Run migration to that destination. Transfers process small resumable batches, verify size and SHA-256, then change the database pointer. Keep the admin page open while migration runs; pausing or closing it leaves completed objects intact.
5. Verify representative tenant and marketing images, counts and usage. Existing `/api/media/...` URLs remain unchanged. If a new upload cannot transfer, it is retained locally and audited; inspect local usage for fallback files.
6. Select VPS as the destination and migrate back if needed. Old remote objects are cleaned after a delay by the maintenance worker, only when no media row references them. Keep old credentials until cleanup is complete.

Zone and region are immutable connection properties. Create a new connection for a new zone, then migrate. Storage password rotation tests the new password before saving it. Live migration with an actual Bunny account has not yet been performed.

## Enabling local AI

AI is optional and does not participate in public rendering, checkout or contact forms. There is no external inference fallback.

Before enabling, inspect the actual VPS CPU, RAM, disk, swap and concurrent application/database workload. Record representative generation latency, peak memory, queue load and failure recovery. A server size suggestion in the brief is not proof of readiness.

Install Ollama on that same VPS, bind it to loopback, prohibit public exposure and set OLLAMA_NO_CLOUD=1 for both Ollama and application/worker services. The application accepts only `http://127.0.0.1:11434`.

The current allowlist contains `qwen3:4b-instruct`. Verify the exact installed artifact and licence against the [official model page](https://ollama.com/library/qwen3:4b-instruct). Record its full SHA-256 digest from local `/api/tags`, not an abbreviated registry hash. Retain the licence and download provenance with deployment records.

In internal administration, enter that digest, licence record and measured readiness notes, approve readiness, set bounded plan quotas and enable AI. Set AI_ENABLED=true in the application and worker environment only after those checks. Schedule `npm run worker:ai`; it handles one job per invocation and uses a database advisory lock to prevent parallel inference. Configure a service timeout longer than the bounded generation timeout.

Try each supported slot on disposable confirmed business facts; inspect unsupported-claim rejection, cancellation, stale edits and failure recovery. Review is mandatory before acceptance, and acceptance changes the draft only. Disable with AI_ENABLED=false and restart the application/worker if performance deteriorates. Stop the worker for immediate operational isolation; existing published websites remain available.

No provider credentials, VPS access, actual model installation or measured AI readiness were supplied during this implementation. Leave AI disabled until those steps are completed.
