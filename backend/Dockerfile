FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
COPY package*.json ./
RUN npm install --omit=dev

# 复制源代码
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
