# 照见 · 在线证件照

浏览器本地运行的证件照制作工具，支持智能抠图换底色、常用/自定义照片尺寸、人像裁切微调，以及 5 寸、6 寸和 A4 相纸自动排版。

## 本地启动

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 功能

- JPG、PNG、WebP 上传与手机拍摄入口
- 随站点部署的浏览器端 FP16 精细人像模型，照片和推理数据不上传第三方服务器
- 透明、纯色、渐变和自定义底色
- 常用证件照尺寸库、分类搜索、自定义像素/毫米与 DPI
- 人像缩放、水平和垂直位置微调、原图对比
- PNG/JPG 无水印寸照导出
- 5 寸、6 寸、A4 排版照，支持间距、页边距和裁切线
- 最近导出信息记录（不保存照片）

## 说明

人像模型位于 `public/background-removal`，由站点同源提供并由浏览器缓存，不依赖 IMG.LY 公共 CDN。升级 `@imgly/background-removal` 后可执行 `npm run sync:model` 更新经过 SHA-256 校验的模型文件。

生产环境建议返回以下响应头以启用多线程 WASM：

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Vite 开发与预览服务已内置这两个响应头。
