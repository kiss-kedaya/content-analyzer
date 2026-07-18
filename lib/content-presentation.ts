export function getSourceTone(source: string) {
  switch (source.toLowerCase()) {
    case 'x':
    case 'twitter':
      return 'source-x'
    case 'xiaohongshu':
      return 'source-xiaohongshu'
    case 'linuxdo':
      return 'source-linuxdo'
    case 'github':
      return 'source-github'
    default:
      return 'source-default'
  }
}
