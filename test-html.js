const testUrl = 'https://x.com/LaLameimeimei/status/2010317471870521831'

async function test() {
  // 步骤 1: 获取 token
  const tokenRes = await fetch('https://snapvid.net/api/userverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `url=${encodeURIComponent(testUrl)}`
  })
  const { token } = await tokenRes.json()
  console.log('Token:', token.substring(0, 50) + '...')
  
  // 步骤 2: 获取视频链接
  const videoRes = await fetch('https://snapvid.net/api/ajaxSearch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `q=${encodeURIComponent(testUrl)}&w=&v=v2&lang=zh-cn&cftoken=${token}`
  })
  const { data } = await videoRes.json()
  
  console.log('\nHTML 长度:', data.length)
  console.log('\nHTML 内容（前 2000 字符）:')
  console.log(data.substring(0, 2000))
  
  // 测试正则
  const videoRegex = /<a[^>]*href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>([^<]*)<\/a>/g
  const matches = [...data.matchAll(videoRegex)]
  console.log('\n视频链接匹配数:', matches.length)
  
  if (matches.length > 0) {
    console.log('\n第一个匹配:')
    console.log('URL:', matches[0][1])
    console.log('文本:', matches[0][2])
  }
}

test().catch(console.error)
