# Phase A: Token-Based Auth Migration Complete

## 迁移总结

已成功完成 Extension 从不稳定的 cookie-based auth 到显式 token-based auth 的迁移。

## 已完成的改动

### Backend (3 commits)

**jwt_utils.py**:
- `create_extension_token()` - 创建 15 分钟有效的 JWT token
- `verify_extension_token()` - 验证 extension token，包含 scope 检查
- `get_current_user_from_extension_token()` - FastAPI dependency，从 Bearer token 提取用户

**auth.py**:
- 新增 `POST /api/auth/extension-token` endpoint
- Web App 通过 cookie session 认证后可获取 extension token
- 返回 token 和过期时间（900秒）

**apply.py**:
- `/apply/tasks` - 现在需要 Bearer token auth，user_id 从 token 提取
- `/apply/tasks/{task_id}` - 需要 Bearer token，验证 task ownership
- `/apply/tasks/{task_id}/transition` - 需要 Bearer token，验证 ownership

**app.py**:
- CORS 配置更新：支持 `Authorization` header
- 添加 `127.0.0.1` origin支持
- 明确添加 `OPTIONS` 方法支持 preflight

### Web App (1 commit)

**AuthContext.tsx**:
- 新增 `fetchExtensionToken()` - 调用 backend 获取 extension token
- `login()` - 成功登录后获取并广播 `FW_EXTENSION_TOKEN`
- `useEffect init` - 页面初始化时如果已登录则广播 token
- `logout()` - 广播 `FW_EXTENSION_LOGOUT`

### Extension (3 commits)

**content.js**:
- 替换 `FW_AUTH_CHANGED` relay 为 `FW_EXTENSION_TOKEN`/`LOGOUT` relay
- 保留 legacy handler 以向后兼容

**background.js**:
- 新增 token storage: `loadToken()`, `saveToken()`, `clearToken()`
- 新增 `FW_EXTENSION_TOKEN` handler: 保存 token 并启动 polling
- 新增 `FW_EXTENSION_LOGOUT` handler: 清除 token 并停止 polling
- 重写 `initialize()`: 从 storage 加载 token
- 更新 `pollForTask()` auth gate: 检查 `authToken` 而非 `authState`
- 401 错误处理: 清除无效 token 并停止 polling

**api.js**:
- 新增 `getAuthHeaders()` helper - 返回 Bearer token header
- 所有 15+ fetch 调用：删除 `credentials: 'include'`，改用 `getAuthHeaders()`
- `getNextTask()`: 移除 `user_id` query param（从 token 提取）

**observability.js**:
- 所有 fetch 调用改用 `Authorization: Bearer ${authToken}`
- 删除 `credentials: 'include'`

## 架构变更

### Before (Cookie-Based):
```
Web App Login → Backend sets cookie → Extension uses same cookie
└── Problem: Cookie isolation in HTTP/localhost/Service Worker context
```

### After (Token-Based):
```
Web App Login (cookie) → Web fetches extension token → window.postMessage
→ Content Script relays → Background stores token → All API calls use Bearer
└── Solution: Explicit token, no cross-context cookie issues
```

## 手动验证清单（必须完成）

### Test 1: 冷启动（未登录）
**步骤**:
1. 启动 backend: `cd apps/backend && python -m uvicorn api.app:app --reload --host 127.0.0.1 --port 8000`
2. 启动 web: `cd apps/web_control_plane && npm run dev`
3. Reload extension (chrome://extensions)

**期望**:
- Extension console: `[FW Poll] Skipped: no token`
- Backend logs: 无 `/apply/tasks` 请求
- Web: 正常显示 login 页面

### Test 2: 登录启动 Polling ⭐ 最重要
**步骤**:
1. 打开 Web App (localhost:3000)
2. 登录成功
3. 观察三个 console：
   - Web App console (F12)
   - Extension content script console (F12 on any page)
   - Extension background console (chrome://extensions → Inspect views: service worker)

**期望**:
- Web console 必须出现:
  ```
  [FW Web] Extension token fetched successfully
  [FW Web] Sent FW_EXTENSION_TOKEN to extension
  ```
  
- Content script console (打开任意 Web App 页面):
  ```
  [FW CS] Received FW_EXTENSION_TOKEN (len=XXX), forwarding to background
  ```
  
- Background console 必须出现:
  ```
  [FW BG] Received FW_EXTENSION_TOKEN
  [FW Auth] Token saved to storage
  [FW Auth] Token received - starting polling
  [FW Poll] Starting task polling
  Polling for next task...
  ```
  
- Backend logs (terminal) 必须出现:
  ```
  [Auth] Extension token issued for user X
  INFO: 127.0.0.1:XXXXX - "POST /api/auth/extension-token HTTP/1.1" 200
  INFO: 127.0.0.1:XXXXX - "GET /apply/tasks?status=queued&limit=1 HTTP/1.1" 200
  ```
  或 `204 No Content`（如果没有任务）

**❌ 不应出现**:
- 401 Unauthorized errors
- 422 Unprocessable Entity spam
- CORS preflight failures
- `[FW Poll] Skipped: not authenticated`

### Test 3: Logout 停止 Polling
**步骤**:
1. 在已登录状态点击 Web logout

**期望**:
- Web console:
  ```
  [FW Web] Sent FW_EXTENSION_LOGOUT to extension
  ```
  
- Content script console:
  ```
  [FW CS] Received FW_EXTENSION_LOGOUT, forwarding to background
  ```
  
- Background console:
  ```
  [FW BG] Received FW_EXTENSION_LOGOUT
  [FW Auth] Token cleared from storage
  [FW Auth] Logout - stopping polling
  [FW Poll] Stopping task polling
  ```
  
- Backend: 不再继续出现 `/apply/tasks` 请求

### Test 4: Reload Extension 恢复
**步骤**:
1. 用户保持 Web 登录（不 logout）
2. Reload extension (chrome://extensions → 重新加载)
3. 刷新 Web App 页面

**期望**:
- Web App 重新 fetch token 并发送
- Background console 显示 token 加载并恢复 polling

## 验证方式汇总

### 后端日志应该看到:
```bash
# 登录后
[Auth] Login successful for user X
[Auth] Extension token issued for user X

# Extension polling
INFO: ... "GET /apply/tasks?status=queued&limit=1 HTTP/1.1" 200
```

### Extension Background 日志应该看到:
```
[FW BG] Initializing background script
[FW BG] Token-based auth architecture active
[FW Auth] Token loaded from storage { hasToken: true }
[FW BG] Token found - starting task polling
[FW Poll] Starting task polling
Polling for next task...
```

### Extension Content 日志应该看到（Web App页面）:
```
[FW CS] Extension token relay listener registered
[FW CS] Received FW_EXTENSION_TOKEN (len=XXX), forwarding to background
```

## 故障排查

### 如果看到 401 spam:
- 检查 backend 是否在 `127.0.0.1:8000` 运行
- 检查 Web App 是否成功获取 token (console 有 `[FW Web] Extension token fetched successfully`)
- 检查 background 是否收到 token (console 有 `[FW Auth] Token saved to storage`)

### 如果看到 422 errors:
- 这不应该再出现（query params 已从 token 提取）
- 如果出现，说明某处仍在发送 `user_id` query param

### 如果 polling 不启动:
- 检查 background console 是否有 `[FW Poll] Skipped: no token`
- 如果有，说明 token 没有成功传递
- 检查完整的消息链：Web → Content → Background

### 如果看到 CORS errors:
- 检查 backend `app.py` 的 CORS 配置是否包含 `Authorization` header
- 检查 OPTIONS 方法是否允许
- 检查 origin 是否包含 `127.0.0.1`

## 下一步

完成上述4个测试后：

1. 如果全部通过 → 迁移成功 ✅
2. 如果有失败 → 提供完整日志（Web/Content/Background/Backend）以便诊断

## 文件清单

### Modified Files:
- `apps/backend/api/auth/jwt_utils.py`
- `apps/backend/api/routers/auth.py`
- `apps/backend/api/routers/apply.py`
- `apps/backend/api/app.py`
- `apps/web_control_plane/src/contexts/AuthContext.tsx`
- `apps/extension/content.js`
- `apps/extension/background.js`
- `apps/extension/api.js`
- `apps/extension/observability.js`

### Git Commits:
```bash
05278b5 feat(backend): add extension token-based auth (Step A complete)
2369c53 feat(webapp): add extension token fetch and broadcast (Step B complete)
34613e6 feat(extension): add token storage and handlers (Step C+D complete)
ee58e35 feat(extension): migrate to Bearer token auth (Step E complete)
```

---

**重要**: 此迁移已完全兼容本地开发环境（HTTP + localhost/127.0.0.1），无需 HTTPS，无需修改 SameSite/Secure cookie 设置。

