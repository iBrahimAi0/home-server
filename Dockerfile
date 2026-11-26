FROM node:22-bookworm-slim AS builder

WORKDIR /app
ARG FORGE_BACKEND_URL=http://backend:3001
ENV FORGE_BACKEND_URL=$FORGE_BACKEND_URL
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
