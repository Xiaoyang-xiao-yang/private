# TodoList 阿里云部署 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TodoList 项目部署到阿里云 Ubuntu 服务器，通过 GitHub Actions 实现 push-to-main 自动部署。

**Architecture:** GitHub Actions on push to main → SSH into Alibaba Cloud server → git pull + docker-compose -f docker-compose.prod.yml up --build -d。三容器：frontend (Nginx)、backend (Express)、mysql，仅 frontend 80 端口暴露公网，backend 和 mysql 仅容器内网通信。

**Tech Stack:** Docker Compose, GitHub Actions (appleboy/ssh-action), Nginx, Node.js/Express, MySQL 8

---

### Task 1: 创建 .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: 写入 .gitignore 内容**

```bash
# 依赖
node_modules/

# 敏感信息
.env

# 构建产物
frontend/build/

# Docker 数据卷
mysql-data/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 2: 提交**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

### Task 2: 初始化 Git 仓库

**Files:**
- 无新建文件

- [ ] **Step 1: 初始化 git 仓库**

```bash
git init
```

- [ ] **Step 2: 首次提交全部代码**

```bash
git add -A
git commit -m "feat: initial commit — TodoList full-stack app"
```

---

### Task 3: 创建 docker-compose.prod.yml

**Files:**
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: 写入生产环境编排文件**

```yaml
version: '3.9'

services:

  mysql:
    image: mysql:8.0
    container_name: todo-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: todo_db
    volumes:
      - /data/mysql:/var/lib/mysql
    networks:
      - todo-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 5s
      timeout: 5s
      retries: 20

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: todo-backend
    restart: always
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      DB_NAME: todo_db
      SERVER_PORT: 3001
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - todo-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: todo-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - todo-net

networks:
  todo-net:
    driver: bridge
```

- [ ] **Step 2: 提交**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add production docker-compose with env var injection"
```

---

### Task 4: 创建 GitHub Actions 部署工作流

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 确保目录存在并写入 workflow 文件**

```bash
mkdir -p .github/workflows
```

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to Alibaba Cloud

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/todolist
            git pull origin main
            docker-compose -f docker-compose.prod.yml up --build -d
            docker image prune -f
```

- [ ] **Step 2: 提交**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deploy workflow"
```

---

### Task 5: 推送到 GitHub

**前置条件:** 已在 GitHub 创建远程仓库

- [ ] **Step 1: 添加 remote 并推送**

```bash
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: 验证** — 打开 GitHub 仓库页面，确认所有文件已推送

---

### Task 6: 服务器初始化（一次性，SSH 到服务器手动执行）

**前置条件:** 阿里云 Ubuntu 服务器已购买，安全组已开放 80 端口和 SSH 端口

- [ ] **Step 1: 安装 Docker**

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker
docker --version
```

- [ ] **Step 2: 安装 Docker Compose**

```bash
apt-get update
apt-get install -y docker-compose-plugin
docker compose version
```

- [ ] **Step 3: 创建项目目录并拉取代码**

```bash
mkdir -p /opt/todolist
cd /opt/todolist
git clone git@github.com:<你的用户名>/<仓库名>.git .
```

- [ ] **Step 4: 创建 .env 文件**

```bash
cat > /opt/todolist/.env << 'EOF'
MYSQL_ROOT_PASSWORD=<设置一个强密码>
EOF
chmod 600 /opt/todolist/.env
```

- [ ] **Step 5: 生成 SSH 密钥对（用于 GitHub Actions）**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/github_actions
```

将输出的 **私钥** 内容完整复制（保存为 GitHub Secret `SSH_KEY`）。

- [ ] **Step 6: 首次启动服务**

```bash
cd /opt/todolist
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

验证：浏览器访问 `http://<服务器公网IP>`，确认 TodoList 页面正常显示。

---

### Task 7: 配置 GitHub Secrets 并验证部署

- [ ] **Step 1: 在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加三个 Secrets：**

| Secret Name | Value |
|-------------|-------|
| `SSH_HOST` | 服务器公网 IP |
| `SSH_USER` | root |
| `SSH_KEY` | Task 6 Step 5 生成的私钥内容（含 `-----BEGIN...` 到 `-----END...`） |

- [ ] **Step 2: 触发首次自动部署 — 做一个无意义的修改提交并 push 到 main**

```bash
# 在本地任意修改后
git add -A
git commit -m "test: trigger CI deployment"
git push origin main
```

- [ ] **Step 3: 打开 GitHub Actions 页面，观察 workflow 运行，确认每个步骤都通过**

- [ ] **Step 4: 再次访问 `http://<服务器公网IP>`，确认部署生效**

---

## 完成后的项目文件结构

```
item/
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docker-compose.yml          # 本地开发
├── docker-compose.prod.yml     # 生产环境
├── backend/
│   ├── Dockerfile
│   ├── .env                    # 本地开发用（不提交）
│   ├── server.js
│   ├── db.js
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       └── index.css
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-05-27-deploy-design.md
│       └── plans/
│           └── 2026-05-27-deploy-plan.md
└── README.md
```
