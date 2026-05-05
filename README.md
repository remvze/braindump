<div align="center">
  <h2>Braindump</h2>
  <p>Brain dump. Nothing more.</p>
  <a href="https://braindump.run">Visit <strong>Braindump</strong></a> | <a href="https://buymeacoffee.com/remvze">Buy Me a Coffee</a>
</div>

## What is Braindump?

Braindump is a minimal space to quickly write down thoughts, ideas, and notes without extra complexity.

## Self-hosting

Braindump is served as a static site over Caddy and listens on port `8080` in the container.

### Option 1: Docker

Run the prebuilt image:

```bash
docker run -d \
  --name braindump \
  --restart unless-stopped \
  -p 8080:8080 \
  ghcr.io/remvze/braindump
```

Then open `http://localhost:8080`.

Build and run locally from source:

```bash
docker build -t braindump:local .
docker run -d --name braindump -p 8080:8080 braindump:local
```

### Option 2: Docker Compose

This repository already includes a `docker-compose.yml`:

```yaml
services:
  braindump:
    image: ghcr.io/remvze/braindump
    restart: always
    ports:
      - "8080:8080"
```

Start it:

```bash
docker compose up -d
```

Stop it:

```bash
docker compose down
```

Then open `http://localhost:8080`.
