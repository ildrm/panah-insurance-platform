FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app
ARG API_URL=http://api:3001
ENV API_URL=${API_URL} API_ORIGIN=${API_URL} NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm ci && npm run build
FROM node:24.22.1-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production APP_MODE=sandbox
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/.local/objects /app/.local/evidence && chown -R node:node /app/.local
USER node
EXPOSE 3000 3001
CMD ["node","apps/api/dist/main.js"]
