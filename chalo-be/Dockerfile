# syntax=docker/dockerfile:1

# =========================================================
# Chalo Coffee — Backend (NestJS) production image
# Dùng Debian slim (glibc) vì bcrypt xài binary dựng sẵn cho glibc;
# Alpine (musl) sẽ phải biên dịch native -> dễ lỗi.
# =========================================================

########## Build stage ##########
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Pin pnpm 11 cho khớp phiên bản dev đang dùng (lockfile sinh bởi pnpm 11)
RUN npm install -g pnpm@11

# Cài dependencies trước (tận dụng Docker layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source & build ra dist/
COPY . .
RUN pnpm build

# Loại devDependencies để image runtime gọn
RUN pnpm prune --prod

########## Runtime stage ##########
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# Thư mục uploads sẽ được mount volume ở docker-compose (dữ liệu bền)
RUN mkdir -p uploads

EXPOSE 8080

# main.ts tự chạy migrations khi NODE_ENV=production (migrationsRun: isProd)
CMD ["node", "dist/main"]
