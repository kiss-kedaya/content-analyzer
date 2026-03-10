'use client'

import { useState, useCallback } from 'react'
import type { Toast, ToastType } from '@/components/Toast'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${++toastId}`
    const toast: Toast = { id, type, message, duration }

    setToasts(prev => [...prev, toast])

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast('success', message, duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast('error', message, duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast('info', message, duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast('warning', message, duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  }
}
