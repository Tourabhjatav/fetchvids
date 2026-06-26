FROM node:22-bookworm-slim AS build

WORKDIR /app
ARG VITE_ADS_ENABLED=false
ENV VITE_ADS_ENABLED=$VITE_ADS_ENABLED
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=8787 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json requirements.txt ./
RUN npm ci --omit=dev \
    && python3 -m pip install --break-system-packages -r requirements.txt

COPY server ./server
COPY --from=build /app/dist ./dist

USER node
EXPOSE 8787

CMD ["node", "server/index.js"]
