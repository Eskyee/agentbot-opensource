# Dockerfile for tempo-x402-node
# Builds the full autonomous agent node with cognitive architecture
FROM rust:1.93-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Clone tempo-x402 workspace
# Pinned to v9.2.0 — last known-good tag before the v9.3.0 "Composable
# Cartridge Intelligence" refactor (2026-04-11) that changed the soul
# routing surface and introduced llama-server runtime deps not present
# in debian:trixie-slim. Bump this tag intentionally after verifying a
# newer upstream version builds + boots on Railway.
ARG TEMPO_X402_REF=v9.2.0
RUN git clone --branch "${TEMPO_X402_REF}" --depth 1 https://github.com/compusophy/tempo-x402.git .

# Build release binary (all features including soul, agent, erc8004)
RUN cargo build --release --package tempo-x402-node

# Runtime stage
FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    git \
    sqlite3 \
    curl \
    gosu \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and writable data dirs (must be root at this point).
# /data is the persistent volume mount point. Everything that must survive
# a restart lives under /data — sqlite DB, memory, brain checkpoints,
# benchmarks, cartridges, workspace. soul/entrypoint.sh refuses to start
# if /data is not a mount, as a backstop for railway.json's
# requiredMountPath guard.
RUN useradd -m -u 1000 agent \
    && mkdir -p /data \
    && chown -R agent:agent /data

# Copy fail-hard entrypoint that verifies /data is a volume mount.
# Do NOT use --chown=agent:agent here — the entrypoint must run as root
# to fix volume permissions, then drops to uid=1000 via gosu.
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# nginx reverse-proxy config: maps GET / → /soul/status on the internal
# x402-node port (4024). All other paths pass through unchanged.
COPY nginx.conf /etc/nginx/nginx.conf

# Do NOT switch to USER agent here — the entrypoint runs as root to fix
# volume ownership, then drops privileges via gosu before exec-ing x402-node.
WORKDIR /home/agent

# Copy binary
COPY --from=builder /build/target/release/x402-node /usr/local/bin/x402-node

# Environment defaults. All state paths point inside /data (the persistent
# volume) so nothing is written to ephemeral disk.
# x402-node listens on the internal port; nginx fronts it on the public port.
ENV PORT=4024
ENV PUBLIC_PORT=4023
ENV RUST_LOG=info
ENV SOUL_DB_PATH=/data/soul.db
ENV SOUL_MEMORY_FILE=/data/soul_memory.md
ENV SOUL_WORKSPACE_ROOT=/data/workspace
ENV SOUL_CODING_ENABLED=false
ENV SOUL_TOOLS_ENABLED=true

EXPOSE 4023

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:4023/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
