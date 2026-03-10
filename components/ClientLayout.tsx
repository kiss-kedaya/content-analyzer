'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { ToastContainer } from './Toast'
import { useToast } from '@/hooks/useToast'
import { createContext, useContext } from 'react'

interface ToastContextType {
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ClientLayout')
  }
  return context
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast, success, error, info, warning } = useToast()

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      <ErrorBoundary>
        {children}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </ErrorBoundary>
    </ToastContext.Provider>
  )
}
