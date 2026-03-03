import { extractWithSnapvid } from './lib/media-extractor-snapvid'

const testUrl = 'https://x.com/LaLameimeimei/status/2010317471870521831'

console.log('测试 snapvid API...')
console.log('URL:', testUrl)

extractWithSnapvid(testUrl)
  .then(mediaList => {
    console.log('\n✅ 提取成功!')
    console.log('媒体数量:', mediaList.length)
    console.log('\n媒体列表:')
    mediaList.forEach((media, index) => {
      console.log(`\n[${index + 1}] ${media.type}`)
      console.log('  URL:', media.url)
      if (media.quality) console.log('  质量:', media.quality)
    })
  })
  .catch(error => {
    console.error('\n❌ 提取失败:', error.message)
  })
