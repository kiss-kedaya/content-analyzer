'use client'

import { FormEvent, useState } from 'react'
import { Eye, EyeOff, Lock, Loader2 } from '@/components/Icon'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      })
      const data = await response.json()

      if (response.ok && data.success) {
        window.location.assign('/')
        return
      }
      setError(data.error?.message || data.error || '密码错误，请检查后重试。')
    } catch {
      setError('网络连接异常，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4 sm:p-6">
      <section className="surface-card w-full max-w-sm rounded-xl p-6 sm:p-8" aria-labelledby="login-title">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted" aria-hidden="true" />
          <div>
            <h1 id="login-title" className="text-xl font-semibold text-content">登录</h1>
            <p className="mt-0.5 text-sm text-muted">Content Analyzer</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-7 space-y-5" noValidate>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-content">访问密码</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="min-h-12 w-full rounded-xl border border-default bg-surface px-4 pr-12 text-base text-content placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                disabled={loading}
                required
                autoFocus
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && <p id="login-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {loading ? '正在登录…' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-subtle">仅限授权访问。</p>
      </section>
    </main>
  )
}
