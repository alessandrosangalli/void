import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { Extension } from '@tiptap/core'

// Custom extension to add fontSize support to TextStyle
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
})

export function useTipTapEditor({
  content,
  onUpdate,
  onExit,
}: {
  content: string
  onUpdate: (html: string) => void
  onExit?: () => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        code: false,
      }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      TextAlign.configure({
        types: ['paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: 'outline: none; height: 100%; overflow-y: auto;',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape') {
          onExit?.()
          return true
        }
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          onExit?.()
          return true
        }
        // Stop keyboard shortcuts from reaching the board
        event.stopPropagation()
        return false
      },
    },
  })

  return editor
}
