FROM alpine:3.20

RUN apk add --no-cache \
    nginx \
    nginx-mod-rtmp \
    nodejs \
    npm \
    ffmpeg \
    curl

# nginx-rtmp config
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /etc/nginx/conf.d /data
COPY push.conf /etc/nginx/conf.d/push.conf

# Node management server
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY index.js ./

# Startup script — runs nginx + node together
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 1935 8080 8090

CMD ["/start.sh"]
