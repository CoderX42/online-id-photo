# 上线步骤

代码已经适配 Vercel，但支付上线还需要绑定你自己的 Neon 和微信商户账号。按下面顺序操作即可。

## 1. 创建 Neon 数据库

1. 打开 [Neon](https://neon.tech/) 注册或登录。
2. 创建一个免费 Postgres 项目。
3. 复制项目的连接字符串，作为 `DATABASE_URL`。
4. 在项目目录执行：

```bash
DATABASE_URL='你的连接字符串' npm run db:migrate
```

## 2. 配置微信支付

在微信商户平台准备以下信息：商户号、AppID、API v3 密钥、商户证书序列号、商户私钥、平台证书公钥和平台证书序列号。

支付回调地址使用：

```text
https://你的域名/api/pay/webhook
```

## 3. 部署到 Vercel

1. 打开 [Vercel](https://vercel.com/) 并使用 GitHub 登录。
2. Import `CoderX42/online-id-photo` 仓库。
3. Framework 选择 Next.js，Build Command 使用 `npm run build`。
4. 在 Project Settings → Environment Variables 中填写 `.env.example` 中的生产变量。
5. 点击 Deploy。

## 4. 上线验收

部署成功后打开 `/studio`，上传示例照片，点击 JPG 导出，确认可以创建二维码；完成支付后确认订单状态变为 `paid`，再测试 PNG、排版照和 ZIP。

如果没有配置 Neon 或微信凭据，网站仍可浏览和本地处理，但支付接口会明确提示配置缺失，不会错误地放行导出。

## 5. 使用自己的 Linux 服务器部署

项目也提供 Docker 部署文件，不依赖 Vercel。服务器需要 Ubuntu/Debian、Docker 和 Docker Compose。

```bash
git clone https://github.com/CoderX42/online-id-photo.git
cd online-id-photo
cp .env.example .env.production
# 编辑 .env.production，填入生产环境变量
docker compose up -d --build
```

建议给服务器绑定一个域名，并用 Caddy/Nginx 反向代理到 `127.0.0.1:3000`，自动申请 HTTPS。微信支付回调必须使用公网可访问的 HTTPS 地址：

```text
https://你的域名/api/pay/webhook
```

不要把 `.env.production` 提交到 Git，也不要把支付私钥写进 Dockerfile 或镜像。
