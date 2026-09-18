'use client'

import { useState } from 'react'

interface TruncatedIdProps {
  id: string | number
  /** Number of visible characters (default 8) */
  chars?: number
}

export default function TruncatedId({ id, chars = 8 }: TruncatedIdProps) {
  const [copied, setCopied] = useState(false)
  const full = String(id)
  const needsTruncation = full.length > chars + 2
  const display = needsTruncation ? `${full.slice(0, chars)}…` : full

  const handleCopy = () => {
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : full}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-body transition-colors hover:bg-gray-100 hover:text-heading"
    >
      {display}
      <svg
        className={`h-3 w-3 shrink-0 transition-colors ${copied ? 'text-green-500' : 'text-gray-400'}`}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {copied ? (
          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5" y="5" width="8" height="8" rx="1.5" />
            <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  )
}
