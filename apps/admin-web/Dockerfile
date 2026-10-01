FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin-web/package.json ./apps/admin-web/

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/admin-web ./apps/admin-web

RUN npm run build --workspace=@pharmacy-admin/shared
RUN npm run build --workspace=@pharmacy-admin/admin-web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@pharmacy-admin/admin-web"]
