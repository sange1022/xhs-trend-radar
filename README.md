# 小红书爆款雷达

## Windows 最简单启动方式

1. 下载或克隆本项目。
2. 进入项目文件夹。
3. 双击 `start-windows.bat`。
4. 等它自动打开 `http://127.0.0.1:5173/`。
5. 在网页里点“打开登录窗口”，登录小红书后再点“立即扫描”。

如果电脑没有 Node.js，脚本会尝试用 `winget` 安装 Node.js LTS。安装完成后，重新双击 `start-windows.bat`。

## 手动启动

```bash
npm install
npm run api
npm run dev
```

网页地址：

```text
http://127.0.0.1:5173/
```
