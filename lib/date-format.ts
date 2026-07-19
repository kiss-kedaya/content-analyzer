const APP_TIME_ZONE = 'Asia/Shanghai'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

type DateValue = Date | string | number

/** Fixed-zone formatting keeps server HTML and browser hydration identical. */
export function formatAppDate(value: DateValue): string {
  return dateFormatter.format(new Date(value))
}

export function formatAppDateTime(value: DateValue): string {
  return dateTimeFormatter.format(new Date(value))
}
