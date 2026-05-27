# ── 阶段一：构建 React 应用 ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 构建时注入后端 API 地址（通过 nginx 反代，前端无需知道后端地址）
ENV REACT_APP_API_URL=""

RUN npm run build

# ── 阶段二：Nginx 提供静态文件 ───────────────────────────────
FROM nginx:1.25-alpine

# 移除默认配置
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
