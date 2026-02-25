import type { AppSettings } from '../../../shared/settings'
import { DEFAULT_SETTINGS } from '../../../shared/settings'

function q<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  return root.querySelector(selector)! as T
}

const FONT_CANDIDATES = [
  { label: 'Menlo', primary: 'Menlo', value: "Menlo, Monaco, 'Courier New', monospace" },
  { label: 'Monaco', primary: 'Monaco', value: "Monaco, Menlo, 'Courier New', monospace" },
  { label: 'SF Mono', primary: 'SF Mono', value: "'SF Mono', Menlo, Monaco, monospace" },
  { label: 'Fira Code', primary: 'Fira Code', value: "'Fira Code', Menlo, monospace" },
  { label: 'JetBrains Mono', primary: 'JetBrains Mono', value: "'JetBrains Mono', Menlo, monospace" },
  { label: 'Source Code Pro', primary: 'Source Code Pro', value: "'Source Code Pro', Menlo, monospace" },
  { label: 'Consolas', primary: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'Courier New', primary: 'Courier New', value: "'Courier New', Courier, monospace" }
]

function isFontInstalled(fontName: string): boolean {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const text = 'abcdefghijklmnopqrstuvwxyz0123456789'
  ctx.font = '72px monospace'
  const fallbackWidth = ctx.measureText(text).width
  ctx.font = `72px "${fontName}", monospace`
  return ctx.measureText(text).width !== fallbackWidth
}

function getAvailableFonts(): typeof FONT_CANDIDATES {
  return FONT_CANDIDATES.filter((f) => isFontInstalled(f.primary))
}

export class SettingsPanel {
  private overlay: HTMLElement
  private isVisible = false
  private settings: AppSettings = { ...DEFAULT_SETTINGS }
  private onSave: ((settings: AppSettings) => void) | null = null

  constructor() {
    this.overlay = document.getElementById('settings-overlay')!
    this.overlay.innerHTML = this.buildHTML()

    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) this.hide()
    })

    q(this.overlay, '.settings-close').addEventListener('click', () => this.hide())

    this.bindControls()
  }

  private buildHTML(): string {
    return `
      <div class="settings-panel">
        <div class="settings-header">
          <span class="settings-title">Settings</span>
          <button class="settings-close">&times;</button>
        </div>
        <div class="settings-body">
          <div class="settings-section">
            <div class="settings-section-title">Appearance</div>
            <div class="settings-row">
              <span class="settings-label">Theme</span>
              <div class="settings-control">
                <select data-key="theme">
                  <option value="one-dark">One Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
            <div class="settings-row">
              <span class="settings-label">Font Family</span>
              <div class="settings-control">
                <select data-key="fontFamily">
                  ${getAvailableFonts().map((f) => `<option value="${f.value}">${f.label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="settings-row">
              <span class="settings-label">Font Size</span>
              <div class="settings-control">
                <div class="settings-range-group">
                  <input data-key="fontSize" type="range" min="8" max="32" step="1" />
                  <span class="settings-range-value" data-display="fontSize">14px</span>
                </div>
              </div>
            </div>
          </div>
          <div class="settings-section">
            <div class="settings-section-title">Editor</div>
            <div class="settings-row">
              <span class="settings-label">Tab Size</span>
              <div class="settings-control">
                <select data-key="tabSize">
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="8">8</option>
                </select>
              </div>
            </div>
            <div class="settings-row">
              <span class="settings-label">Indent Style</span>
              <div class="settings-control">
                <select data-key="indentStyle">
                  <option value="spaces">Spaces</option>
                  <option value="tabs">Tabs</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>`
  }

  private bindControls(): void {
    const root = this.overlay
    const themeSelect = q<HTMLSelectElement>(root, '[data-key="theme"]')
    const fontFamilySelect = q<HTMLSelectElement>(root, '[data-key="fontFamily"]')
    const fontSizeInput = q<HTMLInputElement>(root, '[data-key="fontSize"]')
    const fontSizeValue = q(root, '[data-display="fontSize"]')
    const tabSizeSelect = q<HTMLSelectElement>(root, '[data-key="tabSize"]')
    const indentStyleSelect = q<HTMLSelectElement>(root, '[data-key="indentStyle"]')

    themeSelect.addEventListener('change', () => {
      this.settings.theme = themeSelect.value as AppSettings['theme']
      this.emitSave()
    })

    fontFamilySelect.addEventListener('change', () => {
      this.settings.fontFamily = fontFamilySelect.value
      this.emitSave()
    })

    fontSizeInput.addEventListener('input', () => {
      const val = parseInt(fontSizeInput.value, 10)
      if (val >= 8 && val <= 32) {
        this.settings.fontSize = val
        fontSizeValue.textContent = `${val}px`
        this.emitSave()
      }
    })

    tabSizeSelect.addEventListener('change', () => {
      this.settings.tabSize = parseInt(tabSizeSelect.value, 10)
      this.emitSave()
    })

    indentStyleSelect.addEventListener('change', () => {
      this.settings.indentWithTabs = indentStyleSelect.value === 'tabs'
      this.emitSave()
    })
  }

  private populateControls(): void {
    const root = this.overlay
    const s = this.settings
    q<HTMLSelectElement>(root, '[data-key="theme"]').value = s.theme
    const fontSelect = q<HTMLSelectElement>(root, '[data-key="fontFamily"]')
    const hasMatch = Array.from(fontSelect.options).some((o) => o.value === s.fontFamily)
    if (hasMatch) {
      fontSelect.value = s.fontFamily
    } else {
      fontSelect.value = fontSelect.options[0].value
    }
    q<HTMLInputElement>(root, '[data-key="fontSize"]').value = String(s.fontSize)
    q(root, '[data-display="fontSize"]').textContent = `${s.fontSize}px`
    q<HTMLSelectElement>(root, '[data-key="tabSize"]').value = String(s.tabSize)
    q<HTMLSelectElement>(root, '[data-key="indentStyle"]').value = s.indentWithTabs ? 'tabs' : 'spaces'
  }

  private emitSave(): void {
    if (this.onSave) this.onSave({ ...this.settings })
  }

  onSettingsSave(callback: (settings: AppSettings) => void): void {
    this.onSave = callback
  }

  show(settings: AppSettings): void {
    this.settings = { ...settings }
    this.populateControls()
    this.isVisible = true
    this.overlay.classList.remove('hidden')
  }

  hide(): void {
    this.isVisible = false
    this.overlay.classList.add('hidden')
  }

  toggle(settings: AppSettings): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show(settings)
    }
  }
}
