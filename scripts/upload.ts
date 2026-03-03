#!/usr/bin/env node

/**
 * Content Analyzer - Batch Upload CLI
 * 
 * Usage:
 *   npm run upload -- --file data.json
 *   npm run upload -- --file data.json --url https://your-domain.vercel.app
 *   npm run upload -- --help
 */

import * as fs from 'fs'
import * as path from 'path'

interface ContentInput {
  source: string
  url: string
  title?: string
  summary: string
  content: string
  score: number
  analyzedBy?: string
}

interface BatchResult {
  success: number
  failed: number
  total: number
  errors: Array<{
    index: number
    url: string
    error: string
  }>
  created: Array<{
    index: number
    id: string
    url: string
  }>
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2)
  const options: Record<string, string> = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const value = args[i + 1]
      options[key] = value
      i++
    }
  }

  return options
}

// 显示帮助信息
function showHelp() {
  console.log(`
Content Analyzer - Batch Upload CLI

Usage:
  npm run upload -- --file <path> [--url <api-url>]

Options:
  --file <path>     Path to JSON file containing content array (required)
  --url <api-url>   API base URL (default: http://localhost:3000)
  --help            Show this help message

Example JSON format:
[
  {
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "Example Tweet",
    "summary": "This is a summary",
    "content": "Full content here...",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  },
  {
    "source": "xiaohongshu",
    "url": "https://xiaohongshu.com/...",
    "summary": "Another summary",
    "content": "More content...",
    "score": 7.0
  }
]

Examples:
  npm run upload -- --file data.json
  npm run upload -- --file data.json --url https://content-analyzer-kappa.vercel.app
  npm run upload -- --help
`)
}

// 读取 JSON 文件
function readJsonFile(filePath: string): ContentInput[] {
  try {
    const absolutePath = path.resolve(filePath)
    const fileContent = fs.readFileSync(absolutePath, 'utf-8')
    const data = JSON.parse(fileContent)

    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array')
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read JSON file: ${error.message}`)
    }
    throw error
  }
}

// 批量上传
async function batchUpload(contents: ContentInput[], apiUrl: string): Promise<BatchResult> {
  const endpoint = `${apiUrl}/api/content/batch`

  console.log(`\n📤 Uploading ${contents.length} items to ${endpoint}...\n`)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contents)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    throw error
  }
}

// 显示结果
function displayResult(result: BatchResult) {
  console.log('━'.repeat(60))
  console.log('📊 Upload Results')
  console.log('━'.repeat(60))
  console.log(`Total:   ${result.total}`)
  console.log(`✅ Success: ${result.success}`)
  console.log(`❌ Failed:  ${result.failed}`)
  console.log('━'.repeat(60))

  if (result.created.length > 0) {
    console.log('\n✅ Successfully created:')
    result.created.forEach(item => {
      console.log(`  [${item.index}] ${item.url}`)
      console.log(`      ID: ${item.id}`)
    })
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Failed items:')
    result.errors.forEach(item => {
      console.log(`  [${item.index}] ${item.url}`)
      console.log(`      Error: ${item.error}`)
    })
  }

  console.log('\n' + '━'.repeat(60))
}

// 主函数
async function main() {
  const options = parseArgs()

  // 显示帮助
  if (options.help) {
    showHelp()
    process.exit(0)
  }

  // 验证参数
  if (!options.file) {
    console.error('❌ Error: --file parameter is required')
    console.log('\nRun with --help for usage information')
    process.exit(1)
  }

  const apiUrl = options.url || 'http://localhost:3000'

  try {
    // 读取文件
    console.log(`📂 Reading file: ${options.file}`)
    const contents = readJsonFile(options.file)
    console.log(`✅ Loaded ${contents.length} items`)

    // 上传
    const result = await batchUpload(contents, apiUrl)

    // 显示结果
    displayResult(result)

    // 退出码
    process.exit(result.failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

// 运行
main()
