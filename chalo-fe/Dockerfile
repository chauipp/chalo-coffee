# syntax=docker/dockerfile:1

# =========================================================
# Chalo Coffee — Frontend (Next.js 16) production image
# Dùng Next.js standalone output -> image runtime rất nhẹ.
# =========================================================

########## Build stage ##########
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@11

# Cài dependencies trước (tận dụng cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# QUAN TRỌNG: NEXT_PUBLIC_* được nhúng cứng vào bundle lúc build,
# nên phải truyền URL API công khai qua build arg (KHÔNG phải runtime env).
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY . .
RUN pnpm build

########## Runtime stage ##########
FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy output standalone (đã gồm server.js + node_modules tối thiểu)
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

# INTERNAL_API_BASE_URL đọc lúc runtime (server components) -> set ở docker-compose
CMD ["node", "server.js"]
