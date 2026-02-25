import { EditorState, Extension, Compartment } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  highlightSpecialChars
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentUnit
} from '@codemirror/language'
import {
  closeBrackets,
  closeBracketsKeymap,
  autocompletion,
  completionKeymap
} from '@codemirror/autocomplete'
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { oneDark } from '@codemirror/theme-one-dark'
import { createLanguageCompartment, loadLanguage } from './language-support'
import { createImagePasteExtension } from './image-paste'
import { createImagePreviewExtension } from './image-widget'
import type { AppSettings } from '../../../../shared/settings'
import { DEFAULT_SETTINGS } from '../../../../shared/settings'

export interface EditorTab {
  id: string
  filePath: string | null
  fileName: string
  state: EditorState
  isDirty: boolean
  languageCompartment: Compartment
}

function basename(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop()!
}

function dirname(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const idx = normalized.lastIndexOf('/')
  return idx === -1 ? '.' : normalized.slice(0, idx)
}

type ChangeCallback = () => void

function buildThemeExtension(theme: AppSettings['theme']): Extension {
  return theme === 'one-dark' ? oneDark : []
}

function buildFontExtension(fontFamily: string, fontSize: number): Extension {
  return EditorView.theme({
    '&': { fontSize: `${fontSize}px` },
    '.cm-content': { fontFamily },
    '.cm-gutters': { fontFamily, fontSize: `${fontSize}px` }
  })
}

function buildTabExtension(tabSize: number, indentWithTabs: boolean): Extension {
  return [
    EditorState.tabSize.of(tabSize),
    indentUnit.of(indentWithTabs ? '\t' : ' '.repeat(tabSize))
  ]
}

export class EditorManager {
  private tabs: Map<string, EditorTab> = new Map()
  private activeTabId: string | null = null
  private view: EditorView | null = null
  private container: HTMLElement
  private onChangeCallbacks: ChangeCallback[] = []
  private tabIdCounter = 0
  private settings: AppSettings = { ...DEFAULT_SETTINGS }
  private themeCompartment = new Compartment()
  private fontCompartment = new Compartment()
  private tabSizeCompartment = new Compartment()

  constructor(container: HTMLElement) {
    this.container = container
  }

  onChange(callback: ChangeCallback): void {
    this.onChangeCallbacks.push(callback)
  }

  private emitChange(): void {
    for (const cb of this.onChangeCallbacks) cb()
  }

  private createExtensions(languageCompartment: Compartment): Extension[] {
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      search({ top: true }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        ...searchKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab
      ]),
      this.themeCompartment.of(buildThemeExtension(this.settings.theme)),
      this.fontCompartment.of(buildFontExtension(this.settings.fontFamily, this.settings.fontSize)),
      this.tabSizeCompartment.of(buildTabExtension(this.settings.tabSize, this.settings.indentWithTabs)),
      languageCompartment.of([]),
      createImagePasteExtension(() => {
        const tab = this.getActiveTab();
        return {
          filePath: tab?.filePath ?? "",
          fileName: tab?.fileName ?? ""
        };
      }),
      createImagePreviewExtension(() => {
        const tab = this.getActiveTab()
        return tab?.filePath ? dirname(tab.filePath) : ''
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const tab = this.activeTabId ? this.tabs.get(this.activeTabId) : null
          if (tab) tab.isDirty = true
          this.emitChange()
        }
        if (update.selectionSet) {
          this.emitChange()
        }
      })
    ]
  }

  createTab(filePath: string | null, content: string, fileName?: string): string {
    const id = `tab-${++this.tabIdCounter}`
    const name = fileName || (filePath ? basename(filePath) : 'untitled')

    const { compartment } = createLanguageCompartment()

    const state = EditorState.create({
      doc: content,
      extensions: this.createExtensions(compartment)
    })

    const tab: EditorTab = {
      id,
      filePath,
      fileName: name,
      state,
      isDirty: false,
      languageCompartment: compartment
    }

    this.tabs.set(id, tab)
    return id
  }

  switchTo(tabId: string): void {
    const tab = this.tabs.get(tabId)
    if (!tab) return

    if (this.activeTabId && this.view) {
      const currentTab = this.tabs.get(this.activeTabId)
      if (currentTab) {
        currentTab.state = this.view.state
      }
    }

    this.activeTabId = tabId

    if (this.view) {
      this.view.setState(tab.state)
    } else {
      this.view = new EditorView({
        state: tab.state,
        parent: this.container
      })
    }

    if (tab.filePath && this.view) {
      const expectedTabId = tabId
      loadLanguage(tab.filePath, this.view, tab.languageCompartment, () => {
        return this.activeTabId !== expectedTabId
      })
    }

    this.emitChange()
  }

  closeTab(tabId: string): string | null {
    const tab = this.tabs.get(tabId)
    if (!tab) return this.activeTabId

    if (this.activeTabId === tabId && this.view) {
      tab.state = this.view.state
    }

    this.tabs.delete(tabId)

    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.tabs.keys())
      if (remaining.length > 0) {
        this.switchTo(remaining[remaining.length - 1])
        return this.activeTabId
      } else {
        if (this.view) {
          this.view.destroy()
          this.view = null
        }
        this.activeTabId = null
        this.emitChange()
        return null
      }
    }

    return this.activeTabId
  }

  markSaved(tabId: string, filePath?: string): void {
    const tab = this.tabs.get(tabId)
    if (!tab) return

    tab.isDirty = false

    if (filePath) {
      tab.filePath = filePath
      tab.fileName = basename(filePath)
      if (this.activeTabId === tabId && this.view) {
        const expectedTabId = tabId
        loadLanguage(filePath, this.view, tab.languageCompartment, () => {
          return this.activeTabId !== expectedTabId
        })
      }
    }

    this.emitChange()
  }

  getContent(tabId?: string): string {
    const id = tabId || this.activeTabId
    if (!id) return ''

    if (id === this.activeTabId && this.view) {
      return this.view.state.doc.toString()
    }

    const tab = this.tabs.get(id)
    return tab ? tab.state.doc.toString() : ''
  }

  getCursorPosition(): { line: number; col: number } {
    if (!this.view) return { line: 1, col: 1 }
    const pos = this.view.state.selection.main.head
    const line = this.view.state.doc.lineAt(pos)
    return { line: line.number, col: pos - line.from + 1 }
  }

  getTab(tabId: string): EditorTab | null {
    return this.tabs.get(tabId) || null
  }

  getActiveTab(): EditorTab | null {
    if (!this.activeTabId) return null
    return this.tabs.get(this.activeTabId) || null
  }

  getActiveTabId(): string | null {
    return this.activeTabId
  }

  getAllTabs(): EditorTab[] {
    return Array.from(this.tabs.values())
  }

  reorderTabs(fromIndex: number, toIndex: number): void {
    const entries = Array.from(this.tabs.entries())
    const [moved] = entries.splice(fromIndex, 1)
    entries.splice(toIndex, 0, moved)
    this.tabs = new Map(entries)
  }

  findTabByPath(filePath: string): EditorTab | undefined {
    return Array.from(this.tabs.values()).find((t) => t.filePath === filePath)
  }

  hasUnsavedChanges(): boolean {
    return Array.from(this.tabs.values()).some((t) => t.isDirty)
  }

  async migrateTemporaryImages(filePath: string): Promise<void> {
    if (!this.activeTabId || !this.view) return

    const content = this.view.state.doc.toString()
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g
    const changes: { from: number; to: number; insert: string }[] = []
    const targetDir = dirname(filePath)
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      const src = match[2]
      if (!src.includes('/subline-images/')) continue

      const newPath = await window.api.migrateImage(src, targetDir)
      changes.push({
        from: match.index,
        to: match.index + match[0].length,
        insert: `![${match[1]}](${newPath})`
      })
    }

    if (changes.length > 0) {
      this.view.dispatch({ changes })
    }
  }

  setInitialSettings(settings: AppSettings): void {
    this.settings = { ...settings }
  }

  applySettings(settings: AppSettings): void {
    this.settings = { ...settings }
    if (!this.view) return

    this.view.dispatch({
      effects: [
        this.themeCompartment.reconfigure(buildThemeExtension(settings.theme)),
        this.fontCompartment.reconfigure(buildFontExtension(settings.fontFamily, settings.fontSize)),
        this.tabSizeCompartment.reconfigure(buildTabExtension(settings.tabSize, settings.indentWithTabs))
      ]
    })
  }

  focus(): void {
    this.view?.focus()
  }
}
