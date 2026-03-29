# OpenClaw Gateway for Railway — based on deployment docs
FROM ghcr.io/openclaw/openclaw:2026.3.28

USER root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown node:node /entrypoint.sh
USER node

ENTRYPOINT ["/entrypoint.sh"]
