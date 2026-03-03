'use client'

import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

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
export function BarChart3(props: LucideProps) {
  return <Icon name="BarChart3" {...props} />
}

export function FileText(props: LucideProps) {
  return <Icon name="FileText" {...props} />
}

export function Twitter(props: LucideProps) {
  return <Icon name="Twitter" {...props} />
}

export function BookOpen(props: LucideProps) {
  return <Icon name="BookOpen" {...props} />
}

export function Terminal(props: LucideProps) {
  return <Icon name="Terminal" {...props} />
}

export function Radio(props: LucideProps) {
  return <Icon name="Radio" {...props} />
}

export function TrendingUp(props: LucideProps) {
  return <Icon name="TrendingUp" {...props} />
}

export function ArrowLeft(props: LucideProps) {
  return <Icon name="ArrowLeft" {...props} />
}

export function ExternalLink(props: LucideProps) {
  return <Icon name="ExternalLink" {...props} />
}

export function Clock(props: LucideProps) {
  return <Icon name="Clock" {...props} />
}

export function User(props: LucideProps) {
  return <Icon name="User" {...props} />
}

export function Hash(props: LucideProps) {
  return <Icon name="Hash" {...props} />
}

export function Calendar(props: LucideProps) {
  return <Icon name="Calendar" {...props} />
}

export function Sparkles(props: LucideProps) {
  return <Icon name="Sparkles" {...props} />
}

export function Code(props: LucideProps) {
  return <Icon name="Code" {...props} />
}

export function AlertCircle(props: LucideProps) {
  return <Icon name="AlertCircle" {...props} />
}

export function Zap(props: LucideProps) {
  return <Icon name="Zap" {...props} />
}

export function Eye(props: LucideProps) {
  return <Icon name="Eye" {...props} />
}

export function Trash2(props: LucideProps) {
  return <Icon name="Trash2" {...props} />
}

export function Loader2(props: LucideProps) {
  return <Icon name="Loader2" {...props} />
}

export function ArrowUpDown(props: LucideProps) {
  return <Icon name="ArrowUpDown" {...props} />
}
