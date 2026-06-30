# Discord MCP server (mcp-discord) for Railway.
#
# Wraps the published image and runs it in streamable-HTTP mode, binding to the
# port Railway injects via $PORT. Provides a /mcp endpoint the eve agent's
# Discord connection (via the Vercel Connect connector) talks to.
#
# Source image: https://hub.docker.com/r/barryy625/mcp-discord
FROM barryy625/mcp-discord:latest

ENV PORT=3000
EXPOSE 3000

# Override the image entrypoint so $PORT expands at runtime (Railway sets it).
# The app entrypoint is `node build/app.js` per the upstream README.
ENTRYPOINT []
CMD ["sh", "-c", "node build/app.js --transport http --port ${PORT:-3000}"]
