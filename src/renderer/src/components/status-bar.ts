import { getLanguageName } from './editor/language-support'

export class StatusBar {
  private cursorEl: HTMLElement
  private indentEl: HTMLElement
  private encodingEl: HTMLElement
  private languageEl: HTMLElement

  constructor() {
    this.cursorEl = document.getElementById('status-cursor')!
    this.indentEl = document.getElementById('status-indent')!
    this.encodingEl = document.getElementById('status-encoding')!
    this.languageEl = document.getElementById('status-language')!
  }

  update(cursor: { line: number; col: number }, filePath: string | null): void {
    this.cursorEl.textContent = `Ln ${cursor.line}, Col ${cursor.col}`
    this.languageEl.textContent = getLanguageName(filePath)
  }

  reset(): void {
    this.cursorEl.textContent = 'Ln 1, Col 1'
    this.indentEl.textContent = 'Spaces: 2'
    this.encodingEl.textContent = 'UTF-8'
    this.languageEl.textContent = 'Plain Text'
  }
}
