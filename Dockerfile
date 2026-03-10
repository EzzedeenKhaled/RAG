# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code and public folder
COPY app/ ./app/
COPY public/ ./public/
COPY next.config.ts ./next.config.ts
COPY postcss.config.mjs ./ 

# Build Next.js
RUN npm run build

# -----------------
# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy build artifacts from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/app ./app
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]