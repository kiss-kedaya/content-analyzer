'use client'

import VideoPreview from './VideoPreview'

// 改为静态导入：避免首次打开预览出现一帧 loading（chunk 预加载延迟）
export { VideoPreview }

