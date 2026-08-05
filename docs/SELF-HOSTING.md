# Self-Hosting HAPulse

HAPulse is a static single-page application. The server only needs to serve files — there is no backend process. All communication with Home Assistant happens directly from your browser.

---

## Docker Compose (recommended)

```bash
git clone https://github.com/hapulse/hapulse.git
cd hapulse
docker compose -f docker/docker-compose.yml up -d
```

Open [http://localhost:7421](http://localhost:7421).

To run on a different port, edit `docker/docker-compose.yml`:

```yaml
ports:
  - "8080:80"   # change 8080 to your preferred host port
```

## Plain `docker run`

```bash
docker run -d \
  --name hapulse \
  --restart unless-stopped \
  -p 7421:80 \
  hapulse:latest
```

To build the image yourself first:

```bash
docker build -f docker/Dockerfile -t hapulse:latest .
```

---

## Building from source

Requirements: Node >= 20, npm >= 10.

```bash
npm install
npm run build
```

The compiled SPA is output to `apps/dashboard/dist/`. Serve that directory with any static file server that supports HTML5 history fallback (all paths → `index.html`).

Example with [serve](https://github.com/vercel/serve):

```bash
npx serve -s apps/dashboard/dist -p 7421
```

---

## Serving behind a reverse proxy

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name hapulse.example.com;

    ssl_certificate     /etc/ssl/certs/hapulse.example.com.crt;
    ssl_certificate_key /etc/ssl/private/hapulse.example.com.key;

    location / {
        proxy_pass http://localhost:7421;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Traefik (Docker labels)

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.hapulse.rule=Host(`hapulse.example.com`)"
  - "traefik.http.routers.hapulse.entrypoints=websecure"
  - "traefik.http.routers.hapulse.tls.certresolver=letsencrypt"
  - "traefik.http.services.hapulse.loadbalancer.server.port=80"
```

### Caddy

```
hapulse.example.com {
    reverse_proxy hapulse:80
}
```

---

## Mixed-content and CORS — read this if you serve HAPulse over https

HAPulse is entirely client-side. When you open it in a browser, the browser itself makes two kinds of requests to your Home Assistant instance:

1. **WebSocket** (`ws://` or `wss://`) — used for the live entity subscription and service calls. Authentication is part of the HA WebSocket protocol (your token is sent as a message, not an HTTP header), so **no CORS configuration is needed** in HA for WebSocket connections.

2. **REST API** (`http://` or `https://`) — used for camera snapshots (`/api/camera_proxy/...`) with an `Authorization: Bearer <token>` header. HA allows this by default from any origin, so again **no CORS configuration is needed**.

### The mixed-content rule

Browsers block **active mixed content**: a page loaded over `https://` cannot open `ws://` or make `fetch()` calls to `http://` origins. This means:

- If HAPulse is served over **http** (typical LAN setup), there is no restriction. You can point it at `http://homeassistant.local:8123` freely.
- If HAPulse is served over **https** (e.g. you put it behind a reverse proxy with a certificate), the browser will refuse to connect to a plain `http://` HA URL. Your HA must also be accessible via **https/wss**.

To get https on your HA instance:
- **Nabu Casa** — provides a `https://xxx.ui.nabu.casa` remote URL out of the box.
- **Let's Encrypt via HA's built-in add-on** (`nginx_proxy` or `Let's Encrypt`) — adds TLS to your local HA.
- **Reverse proxy** — put nginx/Traefik/Caddy with a valid cert in front of HA on your LAN.

### Camera snapshots and TLS

Camera snapshots use `GET /api/camera_proxy/<entity_id>?token=<signed_token>` (or with Authorization header). If HA is on a different https origin, the certificate must be valid (not self-signed unless you've added it to the browser's trust store). A self-signed cert will cause the browser to block the image fetch silently — no error is shown in HAPulse, the camera tile simply stays blank.

---

## Updating

With Docker Compose, pull the new image (once it's published to a registry) or rebuild from source:

```bash
# rebuild from latest source
git pull
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
```

---

## Where settings are stored

Once you are connected, your settings are stored **in your own Home Assistant**, using its per-user `frontend/user_data` storage (the same mechanism HA's own frontend uses for user preferences). HAPulse writes them under the key `hapulse:settings`, scoped to the Home Assistant user you signed in as.

This means your theme, layout, room order and hidden items:

- **survive your browser clearing its storage** (Safari and some hardened browsers evict site storage after ~7 days of inactivity), and
- **sync across every browser and device** you use with the same Home Assistant login — change the theme on your laptop and your phone follows, live.

The browser still keeps a local copy so the first paint is instant and onboarding works before you are connected:

| Where | Key | Contents |
|---|---|---|
| Home Assistant (per HA user) | `hapulse:settings` | Theme, accent color, room order, hidden rooms/entities, entity overrides — the source of truth once connected |
| Browser `localStorage` | `hapulse:settings` | Local cache of the above |
| Browser `localStorage` | `hapulse:connection` | HA URL, demo flag |
| Browser `localStorage` | `hapulse:ha-tokens` | OAuth tokens / long-lived access token — **never** leaves your browser |

Nothing is sent to any HAPulse server — the nginx container has no knowledge of your settings, and your access token is never written to Home Assistant or anywhere else. Settings only travel between your browser and your own HA instance.

> Because HA is the source of truth once connected, settings you change while HA is unreachable are overwritten by HA's copy when you reconnect.

**Exporting and importing settings**: Settings → scroll to the bottom → Export config / Import config. The exported JSON can be imported on another device, shared with household members, or kept as a backup.

To reset completely, clear localStorage for the HAPulse origin (browser DevTools → Application → Local Storage → Clear all) **and** remove the stored HA copy — otherwise it will be adopted again on the next connect. The Disconnect button in Settings wipes the connection keys only.
