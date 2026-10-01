FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin-api/package.json ./apps/admin-api/

RUN npm ci

COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY apps/admin-api ./apps/admin-api

RUN npm run db:generate --workspace=@pharmacy-admin/db
RUN npm run build --workspace=@pharmacy-admin/shared
RUN npm run build --workspace=@pharmacy-admin/admin-api

EXPOSE 5001
CMD ["npm", "run", "start", "--workspace=@pharmacy-admin/admin-api"]
