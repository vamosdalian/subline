import type { EditorTab } from './editor-manager'

export class TabBar {
  private container: HTMLElement
  private onSelect: (tabId: string) => void
  private onClose: (tabId: string) => void

  constructor(
    container: HTMLElement,
    onSelect: (tabId: string) => void,
    onClose: (tabId: string) => void
  ) {
    this.container = container
    this.onSelect = onSelect
    this.onClose = onClose

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
  }

  render(tabs: EditorTab[], activeTabId: string | null): void {
    this.container.innerHTML = ''

    for (const tab of tabs) {
      const el = document.createElement('div')
      el.className = 'tab'
      el.dataset.tabId = tab.id

      if (tab.id === activeTabId) el.classList.add('active')
      if (tab.isDirty) el.classList.add('dirty')

      el.innerHTML = `
        <span class="tab-name">${this.escapeHtml(tab.fileName)}</span>
        <span class="tab-dirty"></span>
        <span class="tab-close">&times;</span>
      `

      this.container.appendChild(el)
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
