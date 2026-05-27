# 部署方案设计：TodoList 上线阿里云

## 目标

将 TodoList 全栈项目部署到阿里云 Ubuntu 服务器，使用 Docker Compose 容器化编排，通过 GitHub Actions 实现 push-to-main 自动部署。

## 部署架构

```
GitHub 代码仓库
  │ push to main 触发
  ▼
GitHub Actions Runner
  ├── Checkout 代码
  ├── SSH → 阿里云服务器
  │     ├── git pull origin main
  │     └── docker-compose -f docker-compose.prod.yml up --build -d
  ▼
阿里云 Ubuntu 服务器 (:80 / :3001 / :3306 仅容器内网)
  ├── frontend (Nginx)
  ├── backend  (Express)
  └── mysql    (MySQL 8)
```

- 域名：有域名，先 HTTP，后续加 HTTPS
- 数据库：MySQL 容器化，数据持久化到宿主机 `/data/mysql`
- 触发方式：push 到 main 分支自动部署
- 部署方式：GitHub Actions SSH 到服务器，git pull + 本地构建

## 需要新建/修改的文件

| 文件 | 说明 |
|------|------|
| `docker-compose.prod.yml` | 生产环境编排，密码走 `$MYSQL_ROOT_PASSWORD` 环境变量，不硬编码 |
| `.github/workflows/deploy.yml` | CI/CD 工作流：push main → SSH → pull → docker-compose up |
| `.gitignore` | 排除 `.env`、`node_modules`、`mysql-data` 等 |

## docker-compose.prod.yml 设计

相对现有 `docker-compose.yml` 的改动：

- MySQL root 密码通过 `${MYSQL_ROOT_PASSWORD}` 环境变量注入，移除硬编码的 `123456`
- 后端 `DB_PASSWORD` 同样走 `${MYSQL_ROOT_PASSWORD}`
- `backend` 和 `mysql` 服务不映射端口到宿主机，仅容器内网通信
- MySQL 数据卷映射到宿主机 `/data/mysql:/var/lib/mysql`，容器销毁数据不丢失

## GitHub Actions Workflow

- **触发**：push 到 `main`
- **动作**：`appleboy/ssh-action` SSH 到服务器，执行 `git pull` + `docker-compose -f docker-compose.prod.yml up --build -d`
- **需要的 GitHub Secrets**：`SSH_HOST`、`SSH_USER`、`SSH_KEY`

## 服务器侧（手动操作，一次性的）

1. 安装 Docker 和 Docker Compose
2. 创建项目目录 `/opt/todolist`
3. `git clone` 代码到该目录
4. 创建 `.env` 文件，设置 `MYSQL_ROOT_PASSWORD=<强密码>`
5. 启动服务：`docker-compose -f docker-compose.prod.yml up --build -d`
6. 配置 GitHub SSH 公钥，允许 Actions 免密 SSH

## 安全考量

- `.env` 不入 git，手动在服务器上创建
- 数据库和服务端口不暴露到公网
- 服务器安全组仅开放 80 端口（HTTP）
- SSH 端口建议改为非 22 并限制 IP（可选）

## 后续可扩展

- 加上 HTTPS（Let's Encrypt + certbot，在 Nginx 容器中处理）
- 加上健康检查 + 失败自动回滚
- 加上部署状态通知（钉钉/企业微信/webhook）
