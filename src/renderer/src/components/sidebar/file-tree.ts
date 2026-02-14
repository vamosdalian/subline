import type { FileTreeNode } from '../../../../shared/types'

export class FileTree {
  private container: HTMLElement
  private onFileOpen: (filePath: string) => void
  private activeFilePath: string | null = null
  private rootPath: string | null = null

  constructor(container: HTMLElement, onFileOpen: (filePath: string) => void) {
    this.container = container
    this.onFileOpen = onFileOpen
  }

  async loadFolder(folderPath: string): Promise<void> {
    this.rootPath = folderPath
    const tree = await window.api.readDirectoryTree(folderPath)
    this.render(tree)
  }

  setActiveFile(filePath: string | null): void {
    this.activeFilePath = filePath

    this.container.querySelectorAll('.tree-item.active').forEach((el) => {
      el.classList.remove('active')
    })

    if (filePath) {
      const el = this.container.querySelector(`[data-path="${CSS.escape(filePath)}"]`)
      if (el) el.classList.add('active')
    }
  }

  getRootPath(): string | null {
    return this.rootPath
  }

  private render(nodes: FileTreeNode[]): void {
    this.container.innerHTML = ''

    if (nodes.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'tree-empty'
      empty.textContent = 'Empty folder'
      this.container.appendChild(empty)
      return
    }

    const fragment = document.createDocumentFragment()
    for (const node of nodes) {
      fragment.appendChild(this.createTreeNode(node, 0))
    }
    this.container.appendChild(fragment)
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
      icon.textContent = '\u25B6'
      item.appendChild(icon)
      item.appendChild(name)
      wrapper.appendChild(item)

      const children = document.createElement('div')
      children.className = 'tree-children'

      if (node.children) {
        for (const child of node.children) {
          children.appendChild(this.createTreeNode(child, depth + 1))
        }
      }

      wrapper.appendChild(children)

      item.addEventListener('click', () => {
        const isExpanded = children.classList.contains('expanded')
        children.classList.toggle('expanded')
        icon.textContent = isExpanded ? '\u25B6' : '\u25BC'
      })
    } else {
      icon.textContent = '\u00A0\u00A0'
      item.appendChild(icon)
      item.appendChild(name)
      wrapper.appendChild(item)

      item.addEventListener('click', () => {
        this.onFileOpen(node.path)
      })
    }

    return wrapper
  }
}
