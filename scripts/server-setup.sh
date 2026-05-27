#!/bin/bash
set -eo pipefail

echo "=================================="
echo "  TodoList 服务器初始化脚本"
echo "=================================="

# ── 1. Install Docker ──
if ! command -v docker &> /dev/null; then
    echo "[1/6] 安装 Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
else
    echo "[1/6] Docker 已安装: $(docker --version)"
fi

# ── 2. Install Docker Compose plugin ──
if ! docker compose version &> /dev/null; then
    echo "[2/6] 安装 Docker Compose 插件..."
    apt-get update
    apt-get install -y docker-compose-plugin
else
    echo "[2/6] Docker Compose 插件已安装: $(docker compose version)"
fi

# ── 3. Create project directory ──
echo "[3/6] 创建项目目录..."
mkdir -p /opt/todolist

# ── 4. Clone code ──
if [ -d "/opt/todolist/.git" ]; then
    echo "[4/6] 项目目录已存在，跳过 git clone"
else
    echo "[4/6] 克隆代码..."
    git clone https://github.com/Xiaoyang-xiao-yang/private.git /opt/todolist
fi

# ── 5. Create .env ──
echo "[5/6] 创建 .env 文件..."
if [ -f "/opt/todolist/.env" ]; then
    echo "  .env 已存在，跳过"
else
    read -sp "  请输入 MySQL root 密码: " MYSQL_PW
    echo ""
    echo "MYSQL_ROOT_PASSWORD=${MYSQL_PW}" > /opt/todolist/.env
    chmod 600 /opt/todolist/.env
    echo "  .env 已创建"
fi

# ── 6. Generate SSH key for GitHub Actions ──
echo "[6/6] 生成 SSH 密钥（用于 GitHub Actions）..."
if [ -f ~/.ssh/github_actions ]; then
    echo "  ~/.ssh/github_actions 已存在，跳过"
else
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""
    cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
fi

echo ""
echo "=================================="
echo "  初始化完成！"
echo "=================================="
echo ""
echo "接下来需要手动操作："
echo ""
echo "1. 复制下面的私钥内容，作为 GitHub Secret 'SSH_KEY'："
echo ""
cat ~/.ssh/github_actions
echo ""
echo "2. 在 GitHub 仓库 Settings → Secrets → Actions 中添加："
echo "   - SSH_HOST: <服务器公网 IP>"
echo "   - SSH_USER: root"
echo "   - SSH_KEY: （上面复制的私钥）"
echo ""
echo "3. 启动服务："
echo "   cd /opt/todolist"
echo "   docker compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "4. 访问 http://<服务器公网IP> 验证"
