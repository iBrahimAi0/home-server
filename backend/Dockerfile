FROM node:22-bookworm-slim

# Install system dependencies for bots (Python 3, pip, Git, procps for ps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    git \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/forge-python
ENV PATH="/opt/forge-python/bin:${PATH}"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server.js"]
