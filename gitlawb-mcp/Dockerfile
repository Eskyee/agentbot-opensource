FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y curl ca-certificates \
    && curl -fsSL https://gitlawb.com/install.sh | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV GITLAWB_NODE=https://node.gitlawb.com
ENV PATH="/root/.local/bin:$PATH"

CMD ["gl", "mcp", "serve"]
