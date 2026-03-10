# Content Analyzer 测试指南

## Source 规范化测试

### 测试目的
验证 API 接口的 source 字段规范化功能是否正常工作。

### 测试内容
1. 单个创建测试（5 个测试用例）
   - twitter → X
   - Twitter → X
   - linuxdo → Linuxdo
   - xiaohongshu → Xiaohongshu
   - X → X（已规范）

2. 批量创建测试
   - 同时测试多种 source 的规范化
   - 验证批量接口的规范化功能

### 运行测试

#### 前置条件
1. 确保 Content Analyzer 服务正在运行（https://ca.kedaya.xyz）
2. 获取有效的 JWT token（通过登录接口）

#### 运行命令
```bash
# 设置 AUTH_TOKEN 环境变量并运行测试
AUTH_TOKEN=your-jwt-token npm run test:source

# 或者直接运行脚本
AUTH_TOKEN=your-jwt-token node test-source-normalization.js
```

#### Windows PowerShell
```powershell
$env:AUTH_TOKEN="your-jwt-token"
npm run test:source
```

### 测试输出示例

```
╔════════════════════════════════════════════════════════════╗
║     Source 规范化测试                                      ║
╚════════════════════════════════════════════════════════════╝

测试1: twitter → X
输入: twitter
期望: X
✓ 通过: source 正确规范化为 "X"

测试2: Twitter → X
输入: Twitter
期望: X
✓ 通过: source 正确规范化为 "X"

测试3: linuxdo → Linuxdo
输入: linuxdo
期望: Linuxdo
✓ 通过: source 正确规范化为 "Linuxdo"

测试4: xiaohongshu → Xiaohongshu
输入: xiaohongshu
期望: Xiaohongshu
✓ 通过: source 正确规范化为 "Xiaohongshu"

测试5: X → X (已规范)
输入: X
期望: X
✓ 通过: source 正确规范化为 "X"

批量测试: 多种 source 规范化
输入: twitter, linuxdo, xiaohongshu
期望: X, Linuxdo, Xiaohongshu
  ✓ 项目 1: X (正确)
  ✓ 项目 2: Linuxdo (正确)
  ✓ 项目 3: Xiaohongshu (正确)
✓ 通过: 所有 source 正确规范化

清理测试数据...
已删除 8/8 条测试数据

╔════════════════════════════════════════════════════════════╗
║     测试结果                                                ║
╚════════════════════════════════════════════════════════════╝

总测试数: 6
通过: 6 (100.0%)
失败: 0 (0.0%)

测试完成！
```

### 测试特性

#### 自动清理
- 测试完成后自动删除所有创建的测试数据
- 确保不污染生产数据库

#### 详细输出
- 每个测试显示输入、期望和实际结果
- 清晰的 ✓/✕ 标记
- 统计信息汇总

#### 错误处理
- 捕获并显示所有错误
- 即使部分测试失败也会继续运行
- 返回正确的退出码（0=成功，1=失败）

### 故障排查

#### 401 Unauthorized
- 检查 AUTH_TOKEN 是否正确
- 确认 token 未过期
- 尝试重新登录获取新 token

#### 网络错误
- 检查服务是否正在运行
- 确认 API_BASE URL 正确（https://ca.kedaya.xyz）
- 检查网络连接

#### 测试失败
- 检查 API 接口是否正确应用了 normalizeSource
- 查看服务器日志
- 验证数据库中的数据

### 扩展测试

如需添加更多测试用例，编辑 `test-source-normalization.js`：

```javascript
const testCases = [
  // 添加新的测试用例
  {
    name: '测试6: github → GitHub',
    input: 'github',
    expected: 'GitHub',
    data: {
      source: 'github',
      url: `https://github.com/test/${Date.now()}`,
      summary: '测试摘要',
      content: '测试内容',
      score: 8.0
    }
  }
];
```

### 相关文档
- [API 文档](https://ca.kedaya.xyz/api-docs)
- [Source 规范化工具](lib/normalize-source.ts)
- [实施指南](IMPLEMENTATION-GUIDE.md)
