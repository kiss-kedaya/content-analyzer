'use client'

import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

interface IconProps extends LucideProps {
  name: keyof typeof Icons
}

export default function Icon({ name, ...props }: IconProps) {
  const LucideIcon = Icons[name] as React.ComponentType<LucideProps>
  
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`)
    return null
  }
  
  return <LucideIcon {...props} />
}

// 导出常用的 icons 作为 Client Components
export const BarChart3 = (props: LucideProps) => <Icon name="BarChart3" {...props} />
export const FileText = (props: LucideProps) => <Icon name="FileText" {...props} />
export const Twitter = (props: LucideProps) => <Icon name="Twitter" {...props} />
export const BookOpen = (props: LucideProps) => <Icon name="BookOpen" {...props} />
export const Terminal = (props: LucideProps) => <Icon name="Terminal" {...props} />
export const Radio = (props: LucideProps) => <Icon name="Radio" {...props} />
export const TrendingUp = (props: LucideProps) => <Icon name="TrendingUp" {...props} />
export const ArrowLeft = (props: LucideProps) => <Icon name="ArrowLeft" {...props} />
export const ExternalLink = (props: LucideProps) => <Icon name="ExternalLink" {...props} />
export const Clock = (props: LucideProps) => <Icon name="Clock" {...props} />
export const User = (props: LucideProps) => <Icon name="User" {...props} />
export const Hash = (props: LucideProps) => <Icon name="Hash" {...props} />
export const Calendar = (props: LucideProps) => <Icon name="Calendar" {...props} />
export const Sparkles = (props: LucideProps) => <Icon name="Sparkles" {...props} />
export const Code = (props: LucideProps) => <Icon name="Code" {...props} />
export const AlertCircle = (props: LucideProps) => <Icon name="AlertCircle" {...props} />
export const Zap = (props: LucideProps) => <Icon name="Zap" {...props} />
export const Eye = (props: LucideProps) => <Icon name="Eye" {...props} />
export const Trash2 = (props: LucideProps) => <Icon name="Trash2" {...props} />
export const Loader2 = (props: LucideProps) => <Icon name="Loader2" {...props} />
export const ArrowUpDown = (props: LucideProps) => <Icon name="ArrowUpDown" {...props} />
