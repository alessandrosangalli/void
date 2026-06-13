import { useState, useRef, useEffect } from 'react'
import { type Editor } from '@tiptap/react'
import { CARD_COLORS } from '../store'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Palette,
} from 'lucide-react'

const FONT_SIZES = [12, 14, 16, 20, 24, 32]

const TEXT_COLORS = [
  '#111111',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
]

function TextColorButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [open])

  const currentColor =
    editor.getAttributes('textStyle')?.color || '#111111'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`flex items-center justify-center w-7 h-7 rounded-lg border-none cursor-pointer transition-all duration-150 ${open ? 'bg-gray-100' : 'bg-transparent'} text-gray-600 hover:bg-gray-100`}
        onClick={() => setOpen(!open)}
        title="Text Color"
      >
        <Palette size={14} strokeWidth={2.5} />
        <span
          style={{
            position: 'absolute',
            bottom: 3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 12,
            height: 3,
            borderRadius: 2,
            background: currentColor,
          }}
        />
      </button>
      {open && (
        <div className="text-color-popover">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              className={`text-color-dot ${currentColor === color ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => {
                editor.chain().focus().setColor(color).run()
                setOpen(false)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CardToolbar({
  editor,
  cardColor,
  onChangeCardColor,
  position,
}: {
  editor: Editor | null
  cardColor: string
  onChangeCardColor: (color: string) => void
  position: { x: number; y: number }
}) {
  if (!editor) return null

  const btnBase =
    'flex items-center justify-center w-7 h-7 rounded-lg border-none cursor-pointer transition-all duration-150'
  const btnActive = 'bg-black text-white shadow-sm'
  const btnInactive = 'bg-transparent text-gray-600 hover:bg-gray-100'

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10001,
        animation: 'cardToolbarIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes cardToolbarIn {
          from { transform: translateY(6px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .card-toolbar-divider {
          width: 1px;
          height: 20px;
          background: #e5e7eb;
          margin: 0 4px;
          flex-shrink: 0;
        }
        .card-toolbar-select {
          appearance: none;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 700;
          color: #374151;
          cursor: pointer;
          min-width: 42px;
          text-align: center;
          outline: none;
        }
        .card-toolbar-select:hover { background: #e5e7eb; }
        .card-toolbar-color-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .card-toolbar-color-dot:hover { transform: scale(1.2); }
        .card-toolbar-color-dot.active { border-color: #111; box-shadow: 0 0 0 2px white, 0 0 0 4px #111; }
        .text-color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.15s;
        }
        .text-color-dot:hover { transform: scale(1.15); }
        .text-color-dot.active { border-color: #111; }
        .text-color-popover {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 6px;
          background: white;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          width: 120px;
          z-index: 10002;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          background: 'white',
          borderRadius: '14px',
          padding: '5px 8px',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Bold / Italic / Underline */}
        <button
          className={`${btnBase} ${editor.isActive('bold') ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} strokeWidth={2.5} />
        </button>
        <button
          className={`${btnBase} ${editor.isActive('italic') ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} strokeWidth={2.5} />
        </button>
        <button
          className={`${btnBase} ${editor.isActive('underline') ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline size={14} strokeWidth={2.5} />
        </button>

        <div className="card-toolbar-divider" />

        {/* Font size */}
        <select
          className="card-toolbar-select"
          value={
            (() => {
              const attrs = editor.getAttributes('textStyle')
              const size = attrs?.fontSize
                ? parseInt(attrs.fontSize)
                : 16
              return size
            })()
          }
          onChange={(e) => {
            const size = e.target.value
            editor
              .chain()
              .focus()
              .setMark('textStyle', { fontSize: `${size}px` })
              .run()
          }}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>

        <div className="card-toolbar-divider" />

        {/* Text color */}
        <TextColorButton editor={editor} />

        <div className="card-toolbar-divider" />

        {/* Alignment */}
        <button
          className={`${btnBase} ${editor.isActive({ textAlign: 'left' }) ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align Left"
        >
          <AlignLeft size={14} strokeWidth={2.5} />
        </button>
        <button
          className={`${btnBase} ${editor.isActive({ textAlign: 'center' }) ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align Center"
        >
          <AlignCenter size={14} strokeWidth={2.5} />
        </button>
        <button
          className={`${btnBase} ${editor.isActive({ textAlign: 'right' }) ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align Right"
        >
          <AlignRight size={14} strokeWidth={2.5} />
        </button>

        <div className="card-toolbar-divider" />

        {/* Bullet list */}
        <button
          className={`${btnBase} ${editor.isActive('bulletList') ? btnActive : btnInactive}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={14} strokeWidth={2.5} />
        </button>

        <div className="card-toolbar-divider" />

        {/* Card colors */}
        {CARD_COLORS.map((color) => (
          <button
            key={color}
            className={`card-toolbar-color-dot ${cardColor === color ? 'active' : ''}`}
            style={{
              background: color,
              boxShadow:
                color === '#FFFFFF'
                  ? 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                  : undefined,
            }}
            onClick={() => onChangeCardColor(color)}
            title={`Card color ${color}`}
          />
        ))}
      </div>
    </div>
  )
}
