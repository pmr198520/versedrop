# Multi-stage build — keeps the runtime image small.

# ---------- deps (cacheable) ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- builder (compiles TS) ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc --outDir dist

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps     /app/node_modules ./node_modules
COPY --from=builder  /app/dist          ./dist
COPY package.json ./
COPY src/db/schema.sql ./dist/db/schema.sql
# Bible translation data is loaded at runtime by src/bibles.ts.
# The loader looks for data/translations/ relative to its own location;
# placing it at /app/data works for both dist/bibles.js → /app/data and
# tsx-from-src in dev (which uses /app/src/../data).
COPY data ./data
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/server.js"]
