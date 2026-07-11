# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev
COPY --from=builder /app/build ./build
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
EXPOSE 5000
CMD ["node", "server/index.js"]
