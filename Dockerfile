FROM node:20-bookworm as base

# Install build tools
RUN npm install -g pnpm

# Install runtime dependencies
# Nixpacks, heroku buildpacks, and docker cli
RUN apt-get update && apt-get install -y \
  ca-certificates \
  curl \
  git \
  sudo \
  && rm -rf /var/lib/apt/lists/*

ENV DOCKER_VERSION=24.0.5
ENV NIXPACKS_VERSION=1.24.1
ENV BUILDPACKS_VERSION=0.34.2

RUN curl -LsSo /tmp/nixpacks.deb \
  https://github.com/railwayapp/nixpacks/releases/download/v${NIXPACKS_VERSION}/nixpacks-v${NIXPACKS_VERSION}-amd64.deb \
  && dpkg -i /tmp/nixpacks.deb \
  && rm /tmp/nixpacks.deb

RUN curl -LsSo /tmp/docker.tgz \
  https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz \
  && tar xzvf /tmp/docker.tgz -C /usr/local/bin --strip 1 docker/docker \
  && rm /tmp/docker.tgz

RUN curl -LsSo /tmp/buildpacks.tgz \
  https://github.com/buildpacks/pack/releases/download/v${BUILDPACKS_VERSION}/pack-v${BUILDPACKS_VERSION}-linux.tgz \
  && tar xzvf /tmp/buildpacks.tgz -C /usr/local/bin \
  && rm /tmp/buildpacks.tgz

# Copy and install dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile

FROM base as builder

# Copy source code
COPY . /app

# Build the app
RUN pnpm build

FROM base as production

# Copy built app, next.js data, and assets
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/assets /app/assets
COPY --from=builder /app/exts /app/exts
COPY --from=builder /app/public /app/public
COPY --from=builder /app/drizzle /app/drizzle

# remove dev dependencies
RUN pnpm prune --prod

# Start the app
CMD ["node", "dist/server.js"]
