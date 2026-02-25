import type { EditorTab } from './editor-manager'

export class TabBar {
  private container: HTMLElement
  private onSelect: (tabId: string) => void
  private onClose: (tabId: string) => void
  private onReorder: (fromIndex: number, toIndex: number) => void
  private dragFromIndex: number | null = null

  constructor(
    container: HTMLElement,
    onSelect: (tabId: string) => void,
    onClose: (tabId: string) => void,
    onReorder: (fromIndex: number, toIndex: number) => void
  ) {
    this.container = container
    this.onSelect = onSelect
    this.onClose = onClose
    this.onReorder = onReorder

    this.container.addEventListener('mousedown', (e) => {
      const tabEl = (e.target as HTMLElement).closest('.tab') as HTMLElement
      if (!tabEl) return

      const tabId = tabEl.dataset.tabId
      if (!tabId) return

      if ((e.target as HTMLElement).closest('.tab-close')) {
        e.stopPropagation()
        this.onClose(tabId)
        return
      }

      if (e.button === 1) {
        e.preventDefault()
        this.onClose(tabId)
        return
      }

      this.onSelect(tabId)
    })

    this.container.addEventListener('dragstart', (e) => {
      const tabEl = (e.target as HTMLElement).closest('.tab') as HTMLElement
      if (!tabEl) return
      this.dragFromIndex = Number(tabEl.dataset.index)
      tabEl.classList.add('dragging')
      e.dataTransfer!.effectAllowed = 'move'
    })

    this.container.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'move'
      const tabEl = (e.target as HTMLElement).closest('.tab') as HTMLElement
      if (!tabEl || tabEl.classList.contains('dragging')) return
      this.clearDragOver()
      tabEl.classList.add('drag-over')
    })

    this.container.addEventListener('dragleave', (e) => {
      const tabEl = (e.target as HTMLElement).closest('.tab') as HTMLElement
      if (tabEl) tabEl.classList.remove('drag-over')
    })

    this.container.addEventListener('drop', (e) => {
      e.preventDefault()
      this.clearDragOver()
      const tabEl = (e.target as HTMLElement).closest('.tab') as HTMLElement
      if (!tabEl || this.dragFromIndex === null) return
      const toIndex = Number(tabEl.dataset.index)
      if (this.dragFromIndex !== toIndex) {
        this.onReorder(this.dragFromIndex, toIndex)
      }
      this.dragFromIndex = null
    })

    this.container.addEventListener('dragend', () => {
      this.dragFromIndex = null
      this.container.querySelectorAll('.tab.dragging').forEach((el) => el.classList.remove('dragging'))
      this.clearDragOver()
    })
  }

  private clearDragOver(): void {
    this.container.querySelectorAll('.tab.drag-over').forEach((el) => el.classList.remove('drag-over'))
  }

  render(tabs: EditorTab[], activeTabId: string | null): void {
    this.container.innerHTML = ''

    tabs.forEach((tab, index) => {
      const el = document.createElement('div')
      el.className = 'tab'
      el.dataset.tabId = tab.id
      el.dataset.index = String(index)
      el.draggable = true

      if (tab.id === activeTabId) el.classList.add('active')
      if (tab.isDirty) el.classList.add('dirty')

      el.innerHTML = `
        <span class="tab-name">${this.escapeHtml(tab.fileName)}</span>
        <span class="tab-dirty"></span>
        <span class="tab-close">&times;</span>
      `

      this.container.appendChild(el)
    })
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
