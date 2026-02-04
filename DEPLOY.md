# 统计分析平台 - Linux 服务器部署指南

## 一、环境要求

| 项目 | 最低要求 |
|------|---------|
| 操作系统 | Ubuntu 20.04+ / CentOS 8+ / Debian 11+ |
| Docker | 20.10+ |
| Docker Compose | v2.0+ |
| 内存 | 2GB+ |
| 磁盘 | 10GB+ |

---

## 二、快速部署

### 1. 安装 Docker（如未安装）

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose 插件
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

### 2. 上传代码到服务器

```bash
# 方式一：使用 scp
scp -r ./AB user@your-server:/opt/stats-platform

# 方式二：使用 git
cd /opt
git clone your-repo-url stats-platform
```

### 3. 配置环境变量

```bash
cd /opt/stats-platform

# 复制生产环境配置
cp .env.production .env

# 编辑配置（修改域名、密钥等）
nano .env
```

### 4. 构建并启动服务

```bash
# 构建镜像（首次需要几分钟）
docker compose build

# 启动服务（后台运行）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 5. 验证部署

```bash
# 检查服务状态
curl http://localhost/api/v2/health

# 浏览器访问
http://your-server-ip
```

---

## 三、常用运维命令

```bash
# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新部署（拉取新代码后）
git pull
docker compose build
docker compose up -d

# 查看资源使用
docker stats

# 进入容器调试
docker exec -it stats-backend /bin/bash
docker exec -it stats-frontend /bin/sh
```

---

## 四、数据备份

```bash
# 备份数据库
docker cp stats-backend:/data/app.db ./backup/app.db.$(date +%Y%m%d)

# 备份上传的数据文件
tar -czf backup/data.$(date +%Y%m%d).tar.gz ./data/
```

---

## 五、HTTPS 配置（可选）

如需 HTTPS，推荐使用 Nginx Proxy Manager 或 Caddy：

```bash
# 使用 Caddy 自动 HTTPS（简单方案）
docker run -d --name caddy \
  -p 80:80 -p 443:443 \
  -v caddy_data:/data \
  caddy caddy reverse-proxy --from your-domain.com --to localhost:80
```

或修改 `nginx.conf` 添加 SSL 证书配置。

---

## 六、故障排查

| 问题 | 解决方案 |
|------|---------|
| 前端无法访问 API | 检查 `docker compose logs frontend` |
| 数据库错误 | 检查 `./data` 目录权限：`chmod 777 ./data` |
| 端口被占用 | 修改 `docker-compose.yml` 中的端口映射 |
| 构建失败 | 检查网络连接，或使用国内 npm/pip 镜像 |

---

## 七、目录结构

```
/opt/stats-platform/
├── Dockerfile              # 多阶段构建配置
├── docker-compose.yml      # 服务编排
├── nginx.conf              # Nginx 配置
├── .env                    # 环境变量（从 .env.production 复制）
├── backend/                # 后端代码
├── frontend/               # 前端代码
└── data/                   # 数据持久化目录
    └── app.db              # SQLite 数据库
```
