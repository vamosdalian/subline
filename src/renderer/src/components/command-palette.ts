export interface Command {
  id: string
  label: string
  shortcut?: string
  execute: () => void
}

export class CommandPalette {
  private overlay: HTMLElement
  private input: HTMLInputElement
  private list: HTMLElement
  private commands: Command[] = []
  private filteredCommands: Command[] = []
  private selectedIndex = 0
  private isVisible = false

  constructor() {
    this.overlay = document.getElementById('command-palette-overlay')!
    this.input = document.getElementById('command-input') as HTMLInputElement
    this.list = document.getElementById('command-list')!

    this.input.addEventListener('input', () => {
      this.filter(this.input.value)
    })

    this.input.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          this.selectNext()
          break
        case 'ArrowUp':
          e.preventDefault()
          this.selectPrev()
          break
        case 'Enter':
          e.preventDefault()
          this.executeSelected()
          break
        case 'Escape':
          e.preventDefault()
          this.hide()
          break
      }
    })

    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) {
        this.hide()
      }
    })

    this.list.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.command-item') as HTMLElement
      if (!item) return
      const idx = parseInt(item.dataset.index || '0', 10)
      if (idx >= 0 && idx < this.filteredCommands.length) {
        this.hide()
        this.filteredCommands[idx].execute()
      }
    })
  }

  registerCommands(commands: Command[]): void {
    this.commands = commands
  }

  addCommand(command: Command): void {
    const existing = this.commands.findIndex((c) => c.id === command.id)
    if (existing >= 0) {
      this.commands[existing] = command
    } else {
      this.commands.push(command)
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  show(): void {
    this.isVisible = true
    this.overlay.classList.remove('hidden')
    this.input.value = ''
    this.selectedIndex = 0
    this.filteredCommands = [...this.commands]
    this.renderList()
    this.input.focus()
  }

  hide(): void {
    this.isVisible = false
    this.overlay.classList.add('hidden')
    this.input.value = ''
  }

  private filter(query: string): void {
    const q = query.toLowerCase().trim()
    if (!q) {
      this.filteredCommands = [...this.commands]
    } else {
      this.filteredCommands = this.commands.filter((cmd) => {
        return this.fuzzyMatch(cmd.label.toLowerCase(), q)
      })
    }
    this.selectedIndex = 0
    this.renderList()
  }

  private fuzzyMatch(text: string, query: string): boolean {
    let qi = 0
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++
    }
    return qi === query.length
  }

  private renderList(): void {
    this.list.innerHTML = ''

    for (let i = 0; i < this.filteredCommands.length; i++) {
      const cmd = this.filteredCommands[i]
      const el = document.createElement('div')
      el.className = 'command-item'
      el.dataset.index = String(i)
      if (i === this.selectedIndex) el.classList.add('selected')

      let html = `<span class="command-item-label">${this.escapeHtml(cmd.label)}</span>`
      if (cmd.shortcut) {
        html += `<span class="command-item-shortcut">${this.escapeHtml(cmd.shortcut)}</span>`
      }

      el.innerHTML = html
      this.list.appendChild(el)
    }
  }

  private selectNext(): void {
    if (this.filteredCommands.length === 0) return
    this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length
    this.updateSelection()
  }

  private selectPrev(): void {
    if (this.filteredCommands.length === 0) return
    this.selectedIndex =
      (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length
    this.updateSelection()
  }

  private updateSelection(): void {
    this.list.querySelectorAll('.command-item').forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedIndex)
    })
    const selected = this.list.querySelector('.command-item.selected')
    if (selected) selected.scrollIntoView({ block: 'nearest' })
  }

  private executeSelected(): void {
    if (this.filteredCommands.length === 0) return
    const cmd = this.filteredCommands[this.selectedIndex]
    this.hide()
    cmd.execute()
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
