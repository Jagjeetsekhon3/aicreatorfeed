'use client'
import { useRef, useEffect, useCallback, useState } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const TOOLBAR = [
  { cmd: 'bold',          icon: 'B',   title: 'Bold',          style: { fontWeight: 900 } },
  { cmd: 'italic',        icon: 'I',   title: 'Italic',        style: { fontStyle: 'italic' } },
  { cmd: 'underline',     icon: 'U',   title: 'Underline',     style: { textDecoration: 'underline' } },
  { cmd: 'strikeThrough', icon: 'S̶',   title: 'Strikethrough', style: {} },
  null, // divider
  { cmd: 'h2',            icon: 'H2',  title: 'Heading 2',     style: { fontWeight: 700 } },
  { cmd: 'h3',            icon: 'H3',  title: 'Heading 3',     style: { fontWeight: 700 } },
  null,
  { cmd: 'insertUnorderedList', icon: '≡', title: 'Bullet list', style: {} },
  { cmd: 'insertOrderedList',   icon: '1.', title: 'Numbered list', style: {} },
  null,
  { cmd: 'link',          icon: '🔗',  title: 'Insert link',   style: {} },
  { cmd: 'blockquote',    icon: '❝',   title: 'Blockquote',    style: {} },
  { cmd: 'removeFormat',  icon: '✕',   title: 'Clear formatting', style: {} },
]

export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here...', minHeight = 300 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const isInitialized = useRef(false)

  // Set initial content once
  useEffect(() => {
    if (!isInitialized.current && editorRef.current && value) {
      editorRef.current.innerHTML = value
      isInitialized.current = true
    }
  }, [value])

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>()
    if (document.queryCommandState('bold'))          formats.add('bold')
    if (document.queryCommandState('italic'))        formats.add('italic')
    if (document.queryCommandState('underline'))     formats.add('underline')
    if (document.queryCommandState('strikeThrough')) formats.add('strikeThrough')
    if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList')
    if (document.queryCommandState('insertOrderedList'))   formats.add('insertOrderedList')
    setActiveFormats(formats)
  }, [])

  function exec(cmd: string) {
    if (!editorRef.current) return
    editorRef.current.focus()

    if (cmd === 'h2' || cmd === 'h3') {
      document.execCommand('formatBlock', false, cmd)
    } else if (cmd === 'link') {
      const url = prompt('Enter URL:')
      if (url) document.execCommand('createLink', false, url)
    } else if (cmd === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote')
    } else {
      document.execCommand(cmd, false)
    }

    onChange(editorRef.current.innerHTML)
    updateActiveFormats()
  }

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
      updateActiveFormats()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); exec('bold'); break
        case 'i': e.preventDefault(); exec('italic'); break
        case 'u': e.preventDefault(); exec('underline'); break
      }
    }
    // Tab to indent lists
    if (e.key === 'Tab') {
      e.preventDefault()
      document.execCommand(e.shiftKey ? 'outdent' : 'indent', false)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    // Strip external HTML, keep plain text
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const isEmpty = !value || value === '<br>' || value === ''

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
        {TOOLBAR.map((btn, i) =>
          btn === null ? (
            <div key={`sep-${i}`} style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '2px 4px', alignSelf: 'stretch' }} />
          ) : (
            <button
              key={btn.cmd}
              type="button"
              title={btn.title}
              onMouseDown={e => { e.preventDefault(); exec(btn.cmd) }}
              style={{
                ...btn.style,
                background: activeFormats.has(btn.cmd) ? 'rgba(255,109,31,0.2)' : 'transparent',
                border: activeFormats.has(btn.cmd) ? '1px solid rgba(255,109,31,0.4)' : '1px solid transparent',
                color: activeFormats.has(btn.cmd) ? 'var(--color-primary)' : '#9a8f7a',
                borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                fontSize: '13px', fontFamily: 'inherit', minWidth: '28px',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (!activeFormats.has(btn.cmd)) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!activeFormats.has(btn.cmd)) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {btn.icon}
            </button>
          )
        )}
      </div>

      {/* Editor area */}
      <div style={{ position: 'relative' }}>
        {isEmpty && (
          <div style={{ position: 'absolute', top: '14px', left: '14px', color: '#555', fontSize: '14px', pointerEvents: 'none', fontFamily: 'inherit' }}>
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={handlePaste}
          style={{
            minHeight: `${minHeight}px`, padding: '14px', outline: 'none',
            color: 'var(--color-beige)', fontSize: '14px', lineHeight: 1.7, fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Editor styles */}
      <style>{`
        [contenteditable] h2 { font-size: 20px; font-weight: 800; color: var(--color-cream); margin: 16px 0 8px; }
        [contenteditable] h3 { font-size: 16px; font-weight: 700; color: var(--color-cream); margin: 14px 0 6px; }
        [contenteditable] p  { margin: 0 0 10px; }
        [contenteditable] ul { padding-left: 22px; margin: 8px 0; list-style: disc; }
        [contenteditable] ol { padding-left: 22px; margin: 8px 0; list-style: decimal; }
        [contenteditable] li { margin-bottom: 4px; }
        [contenteditable] a  { color: var(--color-primary); text-decoration: underline; }
        [contenteditable] blockquote {
          border-left: 3px solid var(--color-primary); margin: 12px 0; padding: 8px 14px;
          background: rgba(255,109,31,0.05); border-radius: 0 8px 8px 0;
          color: #9a8f7a; font-style: italic;
        }
        [contenteditable] strong, [contenteditable] b { color: var(--color-cream); }
        [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        [contenteditable]:focus { outline: none; }
      `}</style>
    </div>
  )
}
