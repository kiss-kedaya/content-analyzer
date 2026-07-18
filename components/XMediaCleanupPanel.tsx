'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw, Trash2, X } from '@/components/Icon'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type CleanupKind = 'all' | 'content' | 'adultContent'
type ItemKind = Exclude<CleanupKind, 'all'>

interface CleanupCandidate {
  id: string
  kind: ItemKind
  title: string | null
  url: string
  favorited: boolean
  analyzedAt: string
  checks: Array<{ probeUrl: string; status: number | null; error?: string }>
}

interface ScanResponse {
  success: boolean
  data?: {
    scanned: number
    total: number
    nextOffset: number | null
    stats: { unavailable: number; available: number; inconclusive: number; noVideo: number }
    candidates: CleanupCandidate[]
  }
  error?: { message?: string }
}

interface DeleteResponse {
  success: boolean
  data?: {
    deletedCount: number
    deleted: Array<{ kind: ItemKind; id: string }>
    skipped: Array<{ kind: ItemKind; id: string }>
  }
  error?: { message?: string }
}

const kindLabels: Record<CleanupKind, string> = {
  all: '全部内容',
  content: '技术内容',
  adultContent: '成人内容',
}

function itemKey(item: { kind: ItemKind; id: string }) {
  return `${item.kind}:${item.id}`
}

export default function XMediaCleanupPanel() {
  const controllerRef = useRef<AbortController | null>(null)
  const [kind, setKind] = useState<CleanupKind>('all')
  const [candidates, setCandidates] = useState<CleanupCandidate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState({ scanned: 0, total: 0 })
  const [stats, setStats] = useState({ unavailable: 0, available: 0, inconclusive: 0, noVideo: 0 })
  const [isScanning, setIsScanning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scanAll = async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsScanning(true)
    setCandidates([])
    setSelected(new Set())
    setProgress({ scanned: 0, total: 0 })
    setStats({ unavailable: 0, available: 0, inconclusive: 0, noVideo: 0 })
    setMessage(null)
    setError(null)

    let offset = 0
    const found = new Map<string, CleanupCandidate>()
    const totals = { unavailable: 0, available: 0, inconclusive: 0, noVideo: 0 }

    try {
      while (true) {
        const response = await fetch('/api/maintenance/x-media-cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, offset, limit: 12 }),
          signal: controller.signal,
        })
        const result = await response.json() as ScanResponse
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error?.message || '扫描失败，请重试')
        }

        for (const candidate of result.data.candidates) found.set(itemKey(candidate), candidate)
        totals.unavailable += result.data.stats.unavailable
        totals.available += result.data.stats.available
        totals.inconclusive += result.data.stats.inconclusive
        totals.noVideo += result.data.stats.noVideo

        const scanned = offset + result.data.scanned
        setCandidates(Array.from(found.values()))
        setProgress({ scanned, total: result.data.total })
        setStats({ ...totals })

        if (result.data.nextOffset === null) break
        offset = result.data.nextOffset
      }

      const keys = new Set(found.keys())
      setSelected(keys)
      setMessage(found.size > 0 ? `扫描完成，找到 ${found.size} 条待清理内容。` : '扫描完成，没有发现视频已失效的内容。')
    } catch (scanError) {
      if (scanError instanceof DOMException && scanError.name === 'AbortError') {
        setMessage('扫描已停止。')
      } else {
        setError(scanError instanceof Error ? scanError.message : '扫描失败，请重试')
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      setIsScanning(false)
    }
  }

  const deleteSelected = async () => {
    setConfirmOpen(false)
    const items = candidates
      .filter((candidate) => selected.has(itemKey(candidate)))
      .map(({ kind: itemKind, id }) => ({ kind: itemKind, id }))
    if (items.length === 0) return

    setIsDeleting(true)
    setError(null)
    setMessage(null)
    const deletedKeys = new Set<string>()
    let skippedCount = 0

    try {
      for (let index = 0; index < items.length; index += 50) {
        const response = await fetch('/api/maintenance/x-media-cleanup', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmation: 'DELETE_UNAVAILABLE_X_MEDIA',
            items: items.slice(index, index + 50),
          }),
        })
        const result = await response.json() as DeleteResponse
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error?.message || '删除失败，请重试')
        }
        result.data.deleted.forEach((item) => deletedKeys.add(itemKey(item)))
        skippedCount += result.data.skipped.length
      }

      setCandidates((current) => current.filter((candidate) => !deletedKeys.has(itemKey(candidate))))
      setSelected(new Set())
      setMessage(`已删除 ${deletedKeys.size} 条内容${skippedCount > 0 ? `，${skippedCount} 条复检后跳过` : ''}。`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedCount = selected.size
  const allSelected = candidates.length > 0 && selectedCount === candidates.length

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content">检查失效的 X 视频</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              仅把所有已保存视频均返回 403、404 或 410 的记录列为候选。超时、限流和服务端错误不会进入删除列表。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-muted">
              内容范围
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as CleanupKind)}
                disabled={isScanning || isDeleting}
                className="min-h-11 rounded-lg border border-default bg-surface px-3 text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {isScanning ? (
              <button
                type="button"
                onClick={() => controllerRef.current?.abort()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-default px-4 text-sm font-semibold text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X className="h-4 w-4" aria-hidden="true" />停止扫描
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void scanAll()}
                disabled={isDeleting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />开始扫描
              </button>
            )}
          </div>
        </div>

        {(isScanning || progress.total > 0) && (
          <div className="mt-5 border-t border-default pt-4" aria-live="polite">
            <div className="flex items-center justify-between gap-3 text-sm text-muted">
              <span>{isScanning ? '正在检查视频…' : '扫描完成'}</span>
              <span className="tabular-nums">{progress.scanned} / {progress.total}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
              <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress.total > 0 ? Math.min(100, progress.scanned / progress.total * 100) : 0}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-subtle">
              <span>失效 {stats.unavailable}</span>
              <span>可用 {stats.available}</span>
              <span>无法判定 {stats.inconclusive}</span>
              <span>无视频 {stats.noVideo}</span>
            </div>
          </div>
        )}
      </section>

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-[var(--danger)] bg-surface-raised text-[var(--danger)]' : 'border-default bg-surface-raised text-muted'}`} role={error ? 'alert' : 'status'}>
          {error || message}
        </div>
      )}

      {candidates.length > 0 && (
        <section className="surface-card overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-default p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-content">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => setSelected(event.target.checked ? new Set(candidates.map(itemKey)) : new Set())}
                className="h-5 w-5 rounded border-default accent-[var(--brand)]"
              />
              全选候选项（{candidates.length}）
            </label>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={selectedCount === 0 || isDeleting || isScanning}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              删除已选 {selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>
          </div>

          <ul className="divide-y divide-[var(--border)]">
            {candidates.map((candidate) => {
              const key = itemKey(candidate)
              return (
                <li key={key} className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={(event) => setSelected((current) => {
                        const next = new Set(current)
                        if (event.target.checked) next.add(key)
                        else next.delete(key)
                        return next
                      })}
                      aria-label={`选择 ${candidate.title || candidate.id}`}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-default accent-[var(--brand)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-content">{candidate.title || '无标题'}</p>
                        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted">{kindLabels[candidate.kind]}</span>
                        {candidate.favorited && <span className="rounded-full border border-[var(--warning)] px-2 py-0.5 text-xs text-[var(--warning)]">已收藏</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-subtle">
                        <span>{new Date(candidate.analyzedAt).toLocaleString('zh-CN')}</span>
                        <span className="inline-flex items-center gap-1 text-[var(--danger)]">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          {candidate.checks.map((check) => check.status ?? check.error ?? '错误').join(' / ')}
                        </span>
                        <a href={candidate.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                          查看原文 <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!isScanning && progress.total > 0 && candidates.length === 0 && !error && (
        <section className="surface-card flex min-h-48 flex-col items-center justify-center rounded-2xl p-6 text-center">
          <Check className="h-9 w-9 text-[var(--success)]" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-content">没有待清理内容</h2>
          <p className="mt-1 text-sm text-muted">所有可判定的视频都可以正常访问。</p>
        </section>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="删除失效内容"
        message={`将再次检查并永久删除 ${selectedCount} 条视频已失效的内容。无法确认仍为 403、404 或 410 的记录会自动跳过。`}
        confirmText="复检并删除"
        onConfirm={() => void deleteSelected()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
