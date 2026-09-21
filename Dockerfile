FROM node:26.9.0-bookworm-slim AS build
ARG APP_URL
ARG PLATFORM_DOMAIN
ENV APP_URL=$APP_URL
ENV PLATFORM_DOMAIN=$PLATFORM_DOMAIN
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26.9.0-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/infrastructure ./infrastructure
USER node
EXPOSE 3000
CMD ["npm", "start"]
