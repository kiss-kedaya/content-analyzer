/**
 * Source 规范化测试脚本
 * 
 * 测试 API 接口的 source 字段规范化功能：
 * 1. 创建内容时传入旧格式（twitter, linuxdo 等）
 * 2. 验证数据库中存储为规范格式（X, Linuxdo 等）
 * 3. 测试批量创建的规范化
 */

const API_BASE = 'https://ca.kedaya.xyz';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('错误: 请设置 AUTH_TOKEN 环境变量');
  console.error('用法: AUTH_TOKEN=your-token node test-source-normalization.js');
  process.exit(1);
}

// 测试用例
const testCases = [
  {
    name: '测试1: twitter → X',
    input: 'twitter',
    expected: 'X',
    data: {
      source: 'twitter',
      url: `https://x.com/test/${Date.now()}-1`,
      summary: '测试摘要 - twitter 规范化',
      content: '测试内容 - 验证 twitter 是否转换为 X',
      score: 8.0
    }
  },
  {
    name: '测试2: Twitter → X',
    input: 'Twitter',
    expected: 'X',
    data: {
      source: 'Twitter',
      url: `https://x.com/test/${Date.now()}-2`,
      summary: '测试摘要 - Twitter 规范化',
      content: '测试内容 - 验证 Twitter 是否转换为 X',
      score: 8.0
    }
  },
  {
    name: '测试3: linuxdo → Linuxdo',
    input: 'linuxdo',
    expected: 'Linuxdo',
    data: {
      source: 'linuxdo',
      url: `https://linux.do/test/${Date.now()}-3`,
      summary: '测试摘要 - linuxdo 规范化',
      content: '测试内容 - 验证 linuxdo 是否转换为 Linuxdo',
      score: 7.5
    }
  },
  {
    name: '测试4: xiaohongshu → Xiaohongshu',
    input: 'xiaohongshu',
    expected: 'Xiaohongshu',
    data: {
      source: 'xiaohongshu',
      url: `https://xiaohongshu.com/test/${Date.now()}-4`,
      summary: '测试摘要 - xiaohongshu 规范化',
      content: '测试内容 - 验证 xiaohongshu 是否转换为 Xiaohongshu',
      score: 9.0
    }
  },
  {
    name: '测试5: X → X (已规范)',
    input: 'X',
    expected: 'X',
    data: {
      source: 'X',
      url: `https://x.com/test/${Date.now()}-5`,
      summary: '测试摘要 - X 保持不变',
      content: '测试内容 - 验证 X 保持为 X',
      score: 8.5
    }
  }
];

// 批量测试用例
const batchTestCase = {
  name: '批量测试: 多种 source 规范化',
  data: [
    {
      source: 'twitter',
      url: `https://x.com/batch/${Date.now()}-1`,
      summary: '批量测试 - twitter',
      content: '批量测试内容 1',
      score: 7.0
    },
    {
      source: 'linuxdo',
      url: `https://linux.do/batch/${Date.now()}-2`,
      summary: '批量测试 - linuxdo',
      content: '批量测试内容 2',
      score: 8.0
    },
    {
      source: 'xiaohongshu',
      url: `https://xiaohongshu.com/batch/${Date.now()}-3`,
      summary: '批量测试 - xiaohongshu',
      content: '批量测试内容 3',
      score: 9.0
    }
  ],
  expected: ['X', 'Linuxdo', 'Xiaohongshu']
};

// HTTP 请求函数
async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth-token=${AUTH_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// 创建内容
async function createContent(data) {
  return await request('POST', '/api/content', data);
}

// 批量创建内容
async function batchCreateContent(dataArray) {
  return await request('POST', '/api/content/batch', dataArray);
}

// 获取内容详情
async function getContent(id) {
  return await request('GET', `/api/content/${id}`);
}

// 删除内容
async function deleteContent(id) {
  return await request('DELETE', `/api/content/${id}`);
}

// 运行单个测试
async function runTest(testCase) {
  console.log(`\n${testCase.name}`);
  console.log(`输入: ${testCase.input}`);
  console.log(`期望: ${testCase.expected}`);

  let createdId = null;

  try {
    // 创建内容
    const created = await createContent(testCase.data);
    createdId = created.id;

    // 验证 source
    if (created.source === testCase.expected) {
      console.log(`✓ 通过: source 正确规范化为 "${created.source}"`);
      return { success: true, id: createdId };
    } else {
      console.log(`✕ 失败: 期望 "${testCase.expected}"，实际 "${created.source}"`);
      return { success: false, id: createdId };
    }
  } catch (error) {
    console.log(`✕ 错误: ${error.message}`);
    return { success: false, id: createdId };
  }
}

// 运行批量测试
async function runBatchTest(testCase) {
  console.log(`\n${testCase.name}`);
  console.log(`输入: ${testCase.data.map(d => d.source).join(', ')}`);
  console.log(`期望: ${testCase.expected.join(', ')}`);

  const createdIds = [];

  try {
    // 批量创建
    const result = await batchCreateContent(testCase.data);

    if (result.success !== testCase.data.length) {
      console.log(`✕ 失败: 期望创建 ${testCase.data.length} 条，实际成功 ${result.success} 条`);
      return { success: false, ids: createdIds };
    }

    // 验证每个创建的内容
    let allCorrect = true;
    for (let i = 0; i < result.created.length; i++) {
      const item = result.created[i];
      createdIds.push(item.id);

      // 获取详情验证 source
      const content = await getContent(item.id);
      const expected = testCase.expected[i];

      if (content.source === expected) {
        console.log(`  ✓ 项目 ${i + 1}: ${content.source} (正确)`);
      } else {
        console.log(`  ✕ 项目 ${i + 1}: 期望 "${expected}"，实际 "${content.source}"`);
        allCorrect = false;
      }
    }

    if (allCorrect) {
      console.log(`✓ 通过: 所有 source 正确规范化`);
      return { success: true, ids: createdIds };
    } else {
      console.log(`✕ 失败: 部分 source 规范化错误`);
      return { success: false, ids: createdIds };
    }
  } catch (error) {
    console.log(`✕ 错误: ${error.message}`);
    return { success: false, ids: createdIds };
  }
}

// 清理测试数据
async function cleanup(ids) {
  console.log(`\n清理测试数据...`);
  let deleted = 0;

  for (const id of ids) {
    try {
      await deleteContent(id);
      deleted++;
    } catch (error) {
      console.log(`  警告: 删除 ${id} 失败: ${error.message}`);
    }
  }

  console.log(`已删除 ${deleted}/${ids.length} 条测试数据`);
}

// 主函数
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Source 规范化测试                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = [];
  const createdIds = [];

  // 运行单个测试
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    if (result.id) {
      createdIds.push(result.id);
    }
  }

  // 运行批量测试
  const batchResult = await runBatchTest(batchTestCase);
  results.push(batchResult);
  createdIds.push(...batchResult.ids);

  // 统计结果
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     测试结果                                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n总测试数: ${total}`);
  console.log(`通过: ${passed} (${(passed / total * 100).toFixed(1)}%)`);
  console.log(`失败: ${total - passed} (${((total - passed) / total * 100).toFixed(1)}%)`);

  // 清理
  if (createdIds.length > 0) {
    await cleanup(createdIds);
  }

  console.log('\n测试完成！\n');

  // 退出码
  process.exit(passed === total ? 0 : 1);
}

main().catch(error => {
  console.error('\n致命错误:', error);
  process.exit(1);
});
