# Deploying multi-ai

multi-ai is one Node process plus a directory of git repositories (`DATA_DIR`).
Anything that can run a container **with a persistent disk** works. The disk
matters: it holds every prompt, thought trace and artifact.

Always set `APP_PASSWORD` on a public host.

## Option A — any VM (DigitalOcean Droplet, AWS EC2/Lightsail, GCP Compute Engine) — recommended

Cheapest and simplest; a 1 vCPU / 1 GB machine is plenty (the models run at Anthropic).

```bash
# on the VM (Ubuntu), once:
curl -fsSL https://get.docker.com | sh
git clone https://github.com/amaan-toptal/multi-ai.git && cd multi-ai
cp .env.example .env && nano .env        # set APP_PASSWORD
docker compose up -d --build
# HTTPS: edit deploy/Caddyfile with your domain, then
docker run -d --restart unless-stopped --network host \
  -v $PWD/deploy/Caddyfile:/etc/caddy/Caddyfile -v caddy_data:/data caddy
```

Data lives in the `multi-ai-data` Docker volume. Back it up with
`docker run --rm -v multi-ai_multi-ai-data:/d -v $PWD:/b alpine tar czf /b/backup.tgz -C /d .`
(or snapshot the disk). Each workspace is also a normal git repo you can `git push` anywhere.

Provider notes:
- **DigitalOcean**: Droplet "Docker on Ubuntu" marketplace image skips the Docker install step. Enable weekly backups.
- **AWS**: Lightsail "OS only → Ubuntu" is simplest; open port 80/443 in the instance firewall. On EC2 use a security group allowing 80/443.
- **GCP**: Compute Engine e2-small, "Allow HTTP/HTTPS traffic" checked.

## Option B — DigitalOcean App Platform

App Platform builds the Dockerfile directly, but its containers have **no persistent disk**,
so history would be lost on redeploy. Use it only for demos until remote git sync
(see spec.md roadmap) lands.

## Option C — Google Cloud Run / AWS App Runner

Same caveat: the filesystem is ephemeral. Cloud Run can mount a Cloud Storage bucket
(`--add-volume type=cloud-storage`), but git on a FUSE bucket is slow and unsafe with
concurrent writers. Prefer Option A for now. If you do use Cloud Run:

```bash
gcloud run deploy multi-ai --source . --region us-central1 \
  --set-env-vars APP_PASSWORD=...,DATA_DIR=/data \
  --max-instances 1 --timeout 3600 --no-cpu-throttling
```

`--max-instances 1` is required: live runs are held in process memory.
`--timeout 3600` lets long streams finish.

## Reverse proxy note

The live view uses Server-Sent Events. Proxies must not buffer `/api/runs/*/events`
(the Caddyfile above sets `flush_interval -1`; for nginx use `proxy_buffering off;`).
