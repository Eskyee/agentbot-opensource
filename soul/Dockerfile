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
RUN git clone https://github.com/compusophy/tempo-x402.git .

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
    && rm -rf /var/lib/apt/lists/*

# Create non-root user and writable data dirs (must be root at this point)
RUN useradd -m -u 1000 agent \
    && mkdir -p /data /home/agent/data /home/agent/data/workspace \
    && chown -R agent:agent /data /home/agent/data

USER agent
WORKDIR /home/agent

# Copy binary
COPY --from=builder /build/target/release/x402-node /usr/local/bin/x402-node

# Environment defaults
ENV PORT=4023
ENV RUST_LOG=info
ENV SOUL_WORKSPACE_ROOT=/home/agent/data/workspace
ENV SOUL_CODING_ENABLED=false
ENV SOUL_TOOLS_ENABLED=true

EXPOSE 4023

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:4023/health || exit 1

ENTRYPOINT ["x402-node"]
