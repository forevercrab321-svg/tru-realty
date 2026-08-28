# 阿里云函数计算 (Function Compute) 部署

这是**最有可能被 `api.kimi.com` 放行**的宿主 —— 那是一个中国服务，从大陆网络访问它最自然。但它的成本不在钱上，在备案上，先读完再决定。

## 先看清楚代价

| | |
|---|---|
| **计算费用** | 极低。FC 有常驻免费额度，这个网关的用量基本落在里面 |
| **实名认证** | 必须，个人或企业 |
| **ICP 备案** | **这是真正的成本。** FC 的内置域名官方明确写着"仅用于测试，请勿用于线上对外服务"，正式对外要用已备案的自定义域名。大陆备案通常 1–3 周，且需要大陆主体 |

内置域名（`*.fcapp.run`）在我们这个用法下**技术上可用** —— 它强制的 `content-disposition: attachment` 只影响浏览器直接导航，不影响页面里的 `fetch()`。但那是测试域名，不是给生产用的。

**如果不想备案**：选香港地域，不需要备案，但就失去了"大陆 IP"这个唯一的技术优势。

## 部署

1. 控制台 → 函数计算 → 创建函数 → **Web 函数**
2. 运行环境 **Node.js 20**，请求处理程序 `index.handler`
3. 上传 `gateway/aliyun/` 整个目录（`index.mjs` + `gateway.bundle.js`）
4. 触发器：HTTP，认证方式 **anonymous**，方法勾选 `GET` `POST` `OPTIONS`
5. 配置 → 环境变量：

| 变量 | 值 |
|---|---|
| `KIMI_API_KEY` | 你的 key |
| `SESSION_SECRET` | `openssl rand -base64 48` 生成 |
| `ALLOWED_ORIGINS` | `https://forevercrab321-svg.github.io` |
| `KIMI_BASE_URL` | `https://api.kimi.com/coding/v1` |
| `KIMI_MODEL` | `k3` |
| `DEMO_SESSIONS` | `true` |
| `REAL_DATA` | `false` |

6. 验证：`curl -s https://<你的域名>/health`

`gateway.bundle.js` 由 `npm run build:gateway` 生成并已提交，不需要额外构建。改代码请改 `gateway/src/index.ts` 再重新生成，不要直接改 bundle。

## 一个必须知道的限制

审计日志和限流用的是**进程内内存**，FC 会回收实例，所以它只能挡住突发流量，不是持久记录。要做真正的监管留痕，把 `store` 那两个方法指向表格存储或 Redis —— 处理器只需要 get 和 put 两个方法，换起来是十几行。
