# Stage 1: Build stage
FROM node:24-alpine AS build

# Install build dependencies for native Node modules (e.g., better-sqlite3)
RUN apk update && apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    libtool \
    zlib-dev \
    libpng-dev \
    vips-dev \
    python3 \
    make \
    g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production runner stage
FROM node:24-alpine
RUN apk add --no-cache vips-dev

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled files and built admin panel from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/.strapi ./.strapi
COPY --from=build /app/public ./public
# Copy package.json to the run context
COPY package.json ./

EXPOSE 1337

ENV PORT=1337
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
