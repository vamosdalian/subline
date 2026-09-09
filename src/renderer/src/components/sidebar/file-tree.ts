import type { FileTreeNode } from '../../../../shared/types'
import { createFolderIcon } from '../icons'

export interface FileTreeCallbacks {
  onFileOpen: (filePath: string) => void
  onFolderRemove: (folderPath: string) => void
  onStateChange: () => void
}

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

function baseName(path: string): string {
  return path.split('/').filter(Boolean).pop() || path
}

export class FileTree {
  private container: HTMLElement
  private callbacks: FileTreeCallbacks
  private folders: string[] = []
  private trees = new Map<string, FileTreeNode[]>()
  private expanded = new Set<string>()
  private loading = new Set<string>()
  private activeFilePath: string | null = null

  constructor(container: HTMLElement, callbacks: FileTreeCallbacks) {
    this.container = container
    this.callbacks = callbacks
    this.render()
  }

  getFolders(): string[] {
    return [...this.folders]
  }

  getExpandedPaths(): string[] {
    return [...this.expanded]
  }

  /** Appends a folder to the sidebar. Returns false when it is already there. */
  async addFolder(folderPath: string): Promise<boolean> {
    const path = normalizePath(folderPath)

    if (this.folders.includes(path)) {
      this.highlightFolder(path)
      return false
    }

    const loaded = await this.loadTree(path)
    if (!loaded) return false

    this.folders.push(path)
    this.expanded.add(path)
    this.render()
    return true
  }

  removeFolder(folderPath: string): void {
    const path = normalizePath(folderPath)
    const index = this.folders.indexOf(path)
    if (index === -1) return

    this.folders.splice(index, 1)
    this.trees.delete(path)
    this.forgetExpandedUnder(path)
    this.render()
  }

  /** Replaces the whole list, dropping folders that no longer exist on disk. */
  async setFolders(folderPaths: string[], expandedPaths: string[] = []): Promise<void> {
    const unique = [...new Set(folderPaths.map(normalizePath))]

    this.folders = []
    this.trees.clear()
    this.expanded = new Set(expandedPaths.map(normalizePath))

    for (const path of unique) {
      const loaded = await this.loadTree(path)
      if (!loaded) continue
      this.folders.push(path)
      // Sessions saved before expansion tracking existed: open every root.
      if (expandedPaths.length === 0) this.expanded.add(path)
    }

    this.render()
  }

  async refreshFolder(folderPath: string): Promise<void> {
    const path = normalizePath(folderPath)
    if (!this.folders.includes(path)) return

    const loaded = await this.loadTree(path)
    if (!loaded) {
      this.callbacks.onFolderRemove(path)
      return
    }

    this.render()
  }

  setActiveFile(filePath: string | null): void {
    this.activeFilePath = filePath

    this.container.querySelectorAll('.tree-item.active').forEach((el) => {
      el.classList.remove('active')
    })

    if (!filePath) return

    // Nested roots can render the same path more than once.
    this.container.querySelectorAll(`[data-path="${CSS.escape(filePath)}"]`).forEach((el) => {
      el.classList.add('active')
    })
  }

  /** Reads a root one level deep, re-opening whichever sub-folders were expanded. */
  private async loadTree(folderPath: string): Promise<boolean> {
    try {
      const expanded = this.expandedUnder(folderPath)
      this.trees.set(folderPath, await window.api.readDirectoryTree(folderPath, expanded))
      return true
    } catch (error) {
      console.error('Failed to read folder:', folderPath, error)
      this.trees.delete(folderPath)
      return false
    }
  }

  private expandedUnder(folderPath: string): string[] {
    return [...this.expanded].filter((path) => path.startsWith(`${folderPath}/`))
  }

  private async fetchChildren(dirPath: string): Promise<FileTreeNode[]> {
    try {
      // Re-opening a folder restores whatever was expanded inside it in one round trip.
      return await window.api.readDirectoryTree(dirPath, this.expandedUnder(dirPath))
    } catch (error) {
      console.error('Failed to read directory:', dirPath, error)
      return []
    }
  }

  private forgetExpandedUnder(folderPath: string): void {
    for (const path of this.expanded) {
      if (path === folderPath || path.startsWith(`${folderPath}/`)) {
        this.expanded.delete(path)
      }
    }
  }

  private highlightFolder(folderPath: string): void {
    const header = this.container.querySelector(
      `.tree-root[data-root="${CSS.escape(folderPath)}"] .tree-root-header`
    )
    if (!header) return

    header.scrollIntoView({ block: 'nearest' })
    header.classList.add('flash')
    window.setTimeout(() => header.classList.remove('flash'), 600)
  }

  private render(): void {
    this.container.innerHTML = ''

    if (this.folders.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'tree-empty'
      empty.textContent = 'No folders open'
      this.container.appendChild(empty)
      return
    }

    const fragment = document.createDocumentFragment()
    for (const folder of this.folders) {
      fragment.appendChild(this.createRoot(folder))
    }
    this.container.appendChild(fragment)
  }

  private createRoot(folderPath: string): HTMLElement {
    const root = document.createElement('div')
    root.className = 'tree-root'
    root.dataset.root = folderPath

    const isExpanded = this.expanded.has(folderPath)

    const header = document.createElement('div')
    header.className = 'tree-root-header'
    header.title = folderPath

    const icon = document.createElement('span')
    icon.className = 'tree-root-icon'
    icon.appendChild(createFolderIcon())

    const name = document.createElement('span')
    name.className = 'tree-root-name'
    name.textContent = baseName(folderPath)

    const chevron = document.createElement('span')
    chevron.className = 'tree-root-chevron'
    chevron.textContent = '⌃'

    header.append(icon, name, chevron)

    const body = document.createElement('div')
    body.className = 'tree-root-body'
    if (!isExpanded) body.classList.add('collapsed')

    this.renderChildren(body, this.trees.get(folderPath) || [], 1)

    header.addEventListener('click', () => {
      const nowExpanded = !this.expanded.has(folderPath)
      if (nowExpanded) {
        this.expanded.add(folderPath)
      } else {
        this.expanded.delete(folderPath)
      }
      header.classList.toggle('collapsed', !nowExpanded)
      body.classList.toggle('collapsed', !nowExpanded)
      this.callbacks.onStateChange()
    })

    header.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      void this.handleRootContextMenu(folderPath)
    })

    if (!isExpanded) header.classList.add('collapsed')
    root.append(header, body)
    return root
  }

  private async handleRootContextMenu(folderPath: string): Promise<void> {
    const action = await window.api.showFolderContextMenu()
    if (!action) return

    if (action === 'remove') {
      this.callbacks.onFolderRemove(folderPath)
    } else if (action === 'reveal') {
      await window.api.revealPath(folderPath)
    } else if (action === 'refresh') {
      await this.refreshFolder(folderPath)
    }
  }

  private renderChildren(container: HTMLElement, nodes: FileTreeNode[], depth: number): void {
    container.innerHTML = ''

    if (nodes.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'tree-empty tree-empty-inline'
      empty.style.paddingLeft = `${12 + depth * 16}px`
      empty.textContent = 'Empty folder'
      container.appendChild(empty)
      return
    }

    const fragment = document.createDocumentFragment()
    for (const node of nodes) {
      fragment.appendChild(this.createTreeNode(node, depth))
    }
    container.appendChild(fragment)
  }

  private async toggleDirectory(
    node: FileTreeNode,
    item: HTMLElement,
    childrenEl: HTMLElement,
    depth: number
  ): Promise<void> {
    if (this.expanded.has(node.path)) {
      this.expanded.delete(node.path)
      childrenEl.classList.remove('expanded')
      item.classList.add('collapsed')
      this.callbacks.onStateChange()
      return
    }

    const loaded = await this.expandDirectory(node, item, childrenEl, depth)
    if (loaded) this.callbacks.onStateChange()
  }

  /** Reads the directory if needed, then shows it. Returns false while a read is in flight. */
  private async expandDirectory(
    node: FileTreeNode,
    item: HTMLElement,
    childrenEl: HTMLElement,
    depth: number
  ): Promise<boolean> {
    if (!node.children) {
      if (this.loading.has(node.path)) return false
      this.loading.add(node.path)
      item.classList.add('loading')

      try {
        node.children = await this.fetchChildren(node.path)
      } finally {
        this.loading.delete(node.path)
        item.classList.remove('loading')
      }

      this.renderChildren(childrenEl, node.children, depth + 1)
    }

    this.expanded.add(node.path)
    childrenEl.classList.add('expanded')
    item.classList.remove('collapsed')
    return true
  }

  private createTreeNode(node: FileTreeNode, depth: number): HTMLElement {
    const wrapper = document.createElement('div')

    const item = document.createElement('div')
    item.className = 'tree-item'
    item.dataset.path = node.path
    item.style.paddingLeft = `${12 + depth * 16}px`

    if (node.path === this.activeFilePath) {
      item.classList.add('active')
    }

    const icon = document.createElement('span')
    icon.className = 'tree-item-icon'

    const name = document.createElement('span')
    name.className = 'tree-item-name'
    name.textContent = node.name

    if (node.isDirectory) {
      const isExpanded = this.expanded.has(node.path)
      icon.appendChild(createFolderIcon())
      if (!isExpanded) item.classList.add('collapsed')

      const chevron = document.createElement('span')
      chevron.className = 'tree-item-chevron'
      chevron.textContent = '⌃'

      item.appendChild(icon)
      item.appendChild(name)
      item.appendChild(chevron)
      wrapper.appendChild(item)

      const children = document.createElement('div')
      children.className = 'tree-children'
      if (isExpanded) children.classList.add('expanded')

      if (node.children) {
        this.renderChildren(children, node.children, depth + 1)
      } else if (isExpanded) {
        // Expanded in a restored session but the pre-fetch did not reach it.
        void this.expandDirectory(node, item, children, depth)
      }

      wrapper.appendChild(children)

      item.addEventListener('click', () => {
        void this.toggleDirectory(node, item, children, depth)
      })
    } else {
      icon.textContent = '  '
      item.appendChild(icon)
      item.appendChild(name)
      wrapper.appendChild(item)

      item.addEventListener('click', () => {
        this.callbacks.onFileOpen(node.path)
      })
    }

    return wrapper
  }
}
