# Content Analyzer · X 主页捕获插件

这个 Manifest V3 插件读取浏览器已经收到的 X Home Timeline GraphQL 响应，不调用 X 官方付费 API。

## 安装

1. 打开 Chrome/Edge 扩展管理页面。
2. 开启“开发者模式”。
3. 选择“加载已解压的扩展程序”。
4. 选择本目录 `browser-extension`。
5. 点击插件图标，确认网站地址为 `https://ca.kedaya.xyz`，填写网站访问密码并保存。
6. 打开或刷新 `https://x.com/home`，正常向下滚动。

插件只排队带可用图片或 MP4 variants 的帖子，按帖子 ID 本地去重，并以最多 100 条一批上传。失败的队列保留在 `chrome.storage.local`，每 5 分钟自动重试。

## 隐私与费用

- 不读取或保存 X 登录 Cookie、OAuth Token。
- 不请求 X API；只观察当前页面自己的时间线响应。
- Content Analyzer 密码和七天上传令牌仅保存在本机扩展存储。
- 不上传纯文字帖子。
