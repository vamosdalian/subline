import { EditorView, Decoration, WidgetType } from '@codemirror/view'
import { EditorState, StateField, type Extension, type Range } from '@codemirror/state'

const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g

class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    private getBasePath: () => string
  ) {
    super()
  }

  eq(other: ImageWidget): boolean {
    return this.src === other.src
  }

  ignoreEvent(event: Event): boolean {
    return event.type === 'dblclick'
  }

  toDOM(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'cm-image-preview'
    wrapper.style.padding = '4px 0'

    const img = document.createElement('img')
    img.src = 'local-file://' + encodeURI(this.resolvedSrc())
    img.style.maxWidth = '100%'
    img.style.maxHeight = '300px'
    img.style.borderRadius = '4px'
    img.style.display = 'block'
    img.style.cursor = 'pointer'
    img.onerror = () => {
      wrapper.style.display = 'none'
    }
    img.ondblclick = (e) => {
      e.preventDefault()
      window.api.openPath(this.resolvedSrc())
    }

    wrapper.appendChild(img)
    return wrapper
  }

  private resolvedSrc(): string {
    if (this.src.startsWith('/')) return this.src
    const basePath = this.getBasePath()
    if (!basePath) return this.src
    if (this.src.startsWith('./')) {
      return basePath + this.src.slice(1)
    }
    return basePath + '/' + this.src
  }
}

function buildDecorations(
  state: EditorState,
  getBasePath: () => string
): ReturnType<typeof Decoration.set> {
  const decorations: Range<Decoration>[] = []
  const doc = state.doc

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    IMAGE_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = IMAGE_REGEX.exec(line.text)) !== null) {
      decorations.push(
        Decoration.widget({
          widget: new ImageWidget(match[2], getBasePath),
          side: 1
        }).range(line.to)
      )
    }
  }

  return Decoration.set(decorations, true)
}

export function createImagePreviewExtension(getBasePath: () => string): Extension {
  return StateField.define({
    create(state) {
      return buildDecorations(state, getBasePath)
    },
    update(value, tr) {
      if (tr.docChanged) {
        return buildDecorations(tr.state, getBasePath)
      }
      return value
    },
    provide(field) {
      return EditorView.decorations.from(field)
    }
  })
}
