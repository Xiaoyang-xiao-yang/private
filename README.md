# TodoList 全栈项目

React + Node.js + Express + MySQL8，支持 Docker 一键启动。

## 快速启动

```bash
# 在项目根目录（item/）执行
docker-compose up --build -d
```

访问地址：
- 前端：http://localhost
- 后端 API：http://localhost:3001/api/todos

## 停止服务

```bash
docker-compose down
```

## 停止并删除数据卷（清空数据库）

```bash
docker-compose down -v
```

## 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只看后端
docker-compose logs -f backend

# 只看数据库
docker-compose logs -f mysql
```

## 本地开发（不用 Docker）

### 后端
```bash
cd backend
npm install
# 修改 .env 中的 DB_HOST 为 localhost
node server.js
```

### 前端
```bash
cd frontend
npm install
npm start
```
