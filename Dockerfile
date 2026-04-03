FROM node:22.3.0-alpine AS build-stage

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@8.15.9 --activate

COPY package.json pnpm-lock.yaml ./

# Install all deps (needed for build)
RUN pnpm install --frozen-lockfile

COPY . .

RUN NODE_OPTIONS="--max-old-space-size=16384" pnpm build

# Remove dev dependencies after build
RUN pnpm prune --prod


FROM nginx:alpine-slim


# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy only build output
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Remove source maps to save space
RUN find /usr/share/nginx/html -name "*.map" -type f -delete

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
