# Socket.IO Sticky Sessions with nginx

Socket.IO uses a long-polling fallback before upgrading to WebSocket. During the
handshake phase multiple HTTP requests are made, and in a multi-process (cluster)
setup each request can land on a different Node worker. Without sticky sessions
the worker that receives the upgrade request may not be the one that holds the
session state, causing the connection to fail.

**Two options — pick one:**

---

## Option A — Single process (simplest, recommended to start)

In `pm2.config.cjs` leave `instances` at `1` (the default).  
No nginx changes needed. This works for most deployments.

```js
instances: process.env.WEB_CONCURRENCY || 1,
```

Scale up later by switching to Option B once traffic justifies it.

---

## Option B — Multiple processes with sticky sessions

### 1. Enable sticky sessions in nginx

Install the `nginx-module-sticky` or use the built-in `ip_hash` directive.

**`ip_hash` (simplest — works out of the box):**

```nginx
upstream ticket_api {
    ip_hash;                          # routes each client IP to the same worker
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
    server 127.0.0.1:5003;
    server 127.0.0.1:5004;
}

server {
    listen 443 ssl;
    # ... ssl config ...

    location /api/ {
        proxy_pass         http://ticket_api;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> `ip_hash` is not perfect — clients behind NAT share an IP, so load isn't
> perfectly distributed. It's still better than nothing and easy to configure.

### 2. Start multiple PM2 workers on different ports

Set each worker to listen on a distinct port:

```bash
PORT=5001 pm2 start server.js --name ticket-1
PORT=5002 pm2 start server.js --name ticket-2
PORT=5003 pm2 start server.js --name ticket-3
PORT=5004 pm2 start server.js --name ticket-4
```

Or use the `WEB_CONCURRENCY` env var with pm2.config.cjs:

```bash
WEB_CONCURRENCY=4 pm2 start pm2.config.cjs
```

### 3. Set `TRUST_PROXY=1` in your `.env`

nginx adds the real client IP to `X-Forwarded-For`. Express needs to trust that
header for rate limiting to work correctly per real IP instead of all requests
appearing to come from the proxy:

```env
TRUST_PROXY=1
```

---

## Option C — Use Redis adapter (most scalable)

For large-scale deployments, replace the in-memory Socket.IO store with the
Redis adapter. This lets any worker handle any client's events:

```bash
npm install @socket.io/redis-adapter redis
```

In `socket.js`:

```js
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient }   from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```

Add `REDIS_URL` to your `.env` and Redis to your `docker-compose.prod.yml`.  
With the Redis adapter you no longer need sticky sessions.
