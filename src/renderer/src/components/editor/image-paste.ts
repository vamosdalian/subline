import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

export interface ImagePasteContext {
  filePath: string | null
  fileName: string
}

function isImagePasteAllowed(fileName: string | null): boolean {
  if (!fileName) return true
  const dot = fileName.lastIndexOf('.')
  if (dot === -1) return true
  return fileName.slice(dot).toLowerCase() === '.md'
}

function dirname(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  return idx === -1 ? '.' : normalized.slice(0, idx)
}

export function createImagePasteExtension(
  getContext: () => ImagePasteContext
): Extension {
  return EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
      const items = event.clipboardData?.items
      if (!items) return false

      let imageItem: DataTransferItem | null = null
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          imageItem = item
          break
        }
      }
      if (!imageItem) return false

      const ctx = getContext()
      if (!isImagePasteAllowed(ctx.fileName)) return false

      event.preventDefault()

      const blob = imageItem.getAsFile()
      if (!blob) return true

      blob.arrayBuffer().then(async (arrayBuffer) => {
        const uint8Array = new Uint8Array(arrayBuffer)
        let insertPath: string

        if (ctx.filePath) {
          const dir = dirname(ctx.filePath)
          insertPath = await window.api.saveImage(uint8Array, dir)
        } else {
          insertPath = await window.api.saveImageTemp(uint8Array)
        }

        const pos = view.state.selection.main.head
        view.dispatch({
          changes: { from: pos, insert: `![](${insertPath})\n` }
        })
      })

      return true
    }
  })
}
