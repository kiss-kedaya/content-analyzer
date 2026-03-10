/**
 * Source 字段规范化工具
 * 
 * 统一不同来源的命名规范：
 * - twitter/Twitter → X
 * - linuxdo/LinuxDo → Linuxdo
 * - xiaohongshu/XiaoHongShu → Xiaohongshu
 */

const SOURCE_MAPPING: Record<string, string> = {
  // X (Twitter)
  'twitter': 'X',
  'Twitter': 'X',
  'TWITTER': 'X',
  'x': 'X',
  'X': 'X',
  
  // Linuxdo
  'linuxdo': 'Linuxdo',
  'LinuxDo': 'Linuxdo',
  'LINUXDO': 'Linuxdo',
  'linux.do': 'Linuxdo',
  
  // Xiaohongshu
  'xiaohongshu': 'Xiaohongshu',
  'XiaoHongShu': 'Xiaohongshu',
  'XIAOHONGSHU': 'Xiaohongshu',
  'xhs': 'Xiaohongshu',
  'XHS': 'Xiaohongshu',
  '小红书': 'Xiaohongshu',
  
  // GitHub
  'github': 'GitHub',
  'Github': 'GitHub',
  'GITHUB': 'GitHub',
  
  // Reddit
  'reddit': 'Reddit',
  'Reddit': 'Reddit',
  'REDDIT': 'Reddit',
  
  // YouTube
  'youtube': 'YouTube',
  'Youtube': 'YouTube',
  'YOUTUBE': 'YouTube',
  'yt': 'YouTube',
  
  // Bilibili
  'bilibili': 'Bilibili',
  'Bilibili': 'Bilibili',
  'BILIBILI': 'Bilibili',
  'b站': 'Bilibili',
  
  // Weibo
  'weibo': 'Weibo',
  'Weibo': 'Weibo',
  'WEIBO': 'Weibo',
  '微博': 'Weibo',
  
  // Zhihu
  'zhihu': 'Zhihu',
  'Zhihu': 'Zhihu',
  'ZHIHU': 'Zhihu',
  '知乎': 'Zhihu',
}

/**
 * 规范化 source 字段
 * @param source 原始 source 值
 * @returns 规范化后的 source 值
 */
export function normalizeSource(source: string): string {
  if (!source) return source
  
  // 去除首尾空格
  const trimmed = source.trim()
  
  // 查找映射
  if (SOURCE_MAPPING[trimmed]) {
    return SOURCE_MAPPING[trimmed]
  }
  
  // 如果没有映射，返回首字母大写的版本
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/**
 * 批量规范化 source 字段
 * @param sources source 数组
 * @returns 规范化后的 source 数组
 */
export function normalizeSources(sources: string[]): string[] {
  return sources.map(normalizeSource)
}

/**
 * 获取所有支持的 source 规范名称
 * @returns 规范名称数组
 */
export function getSupportedSources(): string[] {
  const uniqueSources = new Set(Object.values(SOURCE_MAPPING))
  return Array.from(uniqueSources).sort()
}
