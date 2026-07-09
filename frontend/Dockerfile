# Stage 1: Build stage
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production runner stage
FROM node:24-alpine

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy build outputs from build stage
COPY --from=build /app/dist ./dist

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["npm", "run", "serve:ssr:gallery"]
