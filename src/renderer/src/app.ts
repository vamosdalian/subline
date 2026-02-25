import { EditorManager } from './components/editor/editor-manager'
import { TabBar } from './components/editor/tab-bar'
import { FileTree } from './components/sidebar/file-tree'
import { StatusBar } from './components/status-bar'
import { CommandPalette, Command } from './components/command-palette'
import { SettingsPanel } from './components/settings-panel'
import type { AppSettings } from '../../shared/settings'
import { DEFAULT_SETTINGS } from '../../shared/settings'

export class App {
  private editorManager: EditorManager
  private tabBar: TabBar
  private fileTree: FileTree
  private statusBar: StatusBar
  private commandPalette: CommandPalette
  private settingsPanel: SettingsPanel
  private sidebar: HTMLElement
  private tabBarEl: HTMLElement
  private editorContainer: HTMLElement
  private welcomeScreen: HTMLElement
  private statusBarEl: HTMLElement
  private currentSettings: AppSettings = { ...DEFAULT_SETTINGS }
  private settingsReady: Promise<void>

  constructor() {
    this.sidebar = document.getElementById('sidebar')!
    this.tabBarEl = document.getElementById('tab-bar')!
    this.editorContainer = document.getElementById('editor-container')!
    this.welcomeScreen = document.getElementById('welcome')!
    this.statusBarEl = document.getElementById('status-bar')!
    this.statusBarEl.style.display = 'none'

    if (localStorage.getItem('sidebarHidden') === 'true') {
      this.sidebar.classList.add('hidden')
    }
    this.syncTrafficLightPadding()

    this.editorManager = new EditorManager(this.editorContainer)
    this.tabBar = new TabBar(
      this.tabBarEl,
      (tabId) => this.selectTab(tabId),
      (tabId) => this.closeTab(tabId),
      (from, to) => {
        this.editorManager.reorderTabs(from, to)
        this.updateUI()
      }
    )
    this.fileTree = new FileTree(document.getElementById('file-tree')!, (filePath) =>
      this.openFile(filePath)
    )
    this.statusBar = new StatusBar()
    this.commandPalette = new CommandPalette()
    this.settingsPanel = new SettingsPanel()

    this.settingsPanel.onSettingsSave((settings) => this.onSettingsChanged(settings))

    this.editorManager.onChange(() => this.onEditorChange())
    this.registerMenuHandlers()
    this.registerCommands()
    this.registerBeforeClose()
    this.settingsReady = this.loadSettings()
    this.loadRecentIntoWelcome()
  }

  private registerMenuHandlers(): void {
    window.api.onMenuNewFile(() => this.newFile())
    window.api.onMenuOpenFile(() => this.openFileDialog())
    window.api.onMenuOpenFolder(() => this.openFolderDialog())
    window.api.onMenuSave(() => this.saveFile())
    window.api.onMenuSaveAs(() => this.saveFileAs())
    window.api.onMenuCloseTab(() => this.closeActiveTab())
    window.api.onMenuToggleSidebar(() => this.toggleSidebar())
    window.api.onMenuCommandPalette(() => this.commandPalette.toggle())
    window.api.onMenuOpenSettings(() => this.openSettings())
    window.api.onMenuOpenRecent((path, type) => this.openRecent(path, type))
  }

  private registerCommands(): void {
    const isMac = navigator.platform.includes('Mac')
    const mod = isMac ? 'Cmd' : 'Ctrl'

    const commands: Command[] = [
      {
        id: 'file.new',
        label: 'New File',
        shortcut: `${mod}+N`,
        execute: () => this.newFile()
      },
      {
        id: 'file.open',
        label: 'Open File...',
        shortcut: `${mod}+O`,
        execute: () => this.openFileDialog()
      },
      {
        id: 'file.openFolder',
        label: 'Open Folder...',
        execute: () => this.openFolderDialog()
      },
      {
        id: 'file.save',
        label: 'Save',
        shortcut: `${mod}+S`,
        execute: () => this.saveFile()
      },
      {
        id: 'file.saveAs',
        label: 'Save As...',
        shortcut: `${mod}+Shift+S`,
        execute: () => this.saveFileAs()
      },
      {
        id: 'file.closeTab',
        label: 'Close Tab',
        shortcut: `${mod}+W`,
        execute: () => this.closeActiveTab()
      },
      {
        id: 'view.toggleSidebar',
        label: 'Toggle Sidebar',
        shortcut: `${mod}+B`,
        execute: () => this.toggleSidebar()
      },
      {
        id: 'preferences.open',
        label: 'Preferences: Open Settings',
        shortcut: `${mod}+,`,
        execute: () => this.openSettings()
      }
    ]

    this.commandPalette.registerCommands(commands)
  }

  private newFile(): void {
    const tabId = this.editorManager.createTab(null, '', 'untitled')
    this.editorManager.switchTo(tabId)
    this.updateUI()
    this.editorManager.focus()
  }

  private async openFileDialog(): Promise<void> {
    const result = await window.api.openFileDialog()
    if (!result) return
    this.openFileWithContent(result.filePath, result.content)
  }

  async openFile(filePath: string): Promise<void> {
    const existing = this.editorManager.findTabByPath(filePath)
    if (existing) {
      this.editorManager.switchTo(existing.id)
      this.updateUI()
      this.editorManager.focus()
      return
    }

    const content = await window.api.readFile(filePath)
    this.openFileWithContent(filePath, content)
  }

  private openFileWithContent(filePath: string, content: string): void {
    const existing = this.editorManager.findTabByPath(filePath)
    if (existing) {
      this.editorManager.switchTo(existing.id)
      this.updateUI()
      this.editorManager.focus()
      return
    }

    const tabId = this.editorManager.createTab(filePath, content)
    this.editorManager.switchTo(tabId)
    this.updateUI()
    this.editorManager.focus()
    if (filePath) window.api.addRecent(filePath, 'file')
  }

  private async openFolderDialog(): Promise<void> {
    const folderPath = await window.api.openFolderDialog()
    if (!folderPath) return
    await this.openFolder(folderPath)
  }

  private async openFolder(folderPath: string): Promise<void> {
    await this.fileTree.loadFolder(folderPath)
    this.sidebar.classList.remove('hidden')
    localStorage.setItem('sidebarHidden', 'false')
    this.syncTrafficLightPadding()
    window.api.addRecent(folderPath, 'folder')
  }

  private async saveFile(): Promise<void> {
    const tab = this.editorManager.getActiveTab()
    if (!tab) return

    if (tab.filePath) {
      await this.editorManager.migrateTemporaryImages(tab.filePath)
      const content = this.editorManager.getContent()
      await window.api.writeFile(tab.filePath, content)
      this.editorManager.markSaved(tab.id)
      this.updateUI()
    } else {
      await this.saveFileAs()
    }
  }

  private async saveFileAs(): Promise<void> {
    const tab = this.editorManager.getActiveTab()
    if (!tab) return

    const filePath = await window.api.saveFileDialog(tab.filePath || undefined)
    if (!filePath) return

    await this.editorManager.migrateTemporaryImages(filePath)
    const content = this.editorManager.getContent()
    await window.api.writeFile(filePath, content)
    this.editorManager.markSaved(tab.id, filePath)
    this.updateUI()
  }

  private selectTab(tabId: string): void {
    this.editorManager.switchTo(tabId)
    this.updateUI()
    this.editorManager.focus()
  }

  private async closeTab(tabId: string): Promise<void> {
    const closed = await this.confirmAndCloseTab(tabId)
    if (closed) {
      this.updateUI()
      if (this.editorManager.getActiveTabId()) {
        this.editorManager.focus()
      }
    }
  }

  private async closeActiveTab(): Promise<void> {
    const tabId = this.editorManager.getActiveTabId()
    if (tabId) await this.closeTab(tabId)
  }

  private async confirmAndCloseTab(tabId: string): Promise<boolean> {
    const tab = this.editorManager.getTab(tabId)
    if (!tab) return false

    if (tab.isDirty) {
      const choice = await window.api.showConfirmSave(tab.fileName)
      if (choice === 'cancel') return false
      if (choice === 'save') {
        await this.saveSpecificTab(tabId)
        const updated = this.editorManager.getTab(tabId)
        if (updated?.isDirty) return false
      }
    }

    this.editorManager.closeTab(tabId)
    return true
  }

  private async saveSpecificTab(tabId: string): Promise<void> {
    const tab = this.editorManager.getTab(tabId)
    if (!tab) return

    if (tab.filePath) {
      await this.editorManager.migrateTemporaryImages(tab.filePath)
      const content = this.editorManager.getContent(tabId)
      await window.api.writeFile(tab.filePath, content)
      this.editorManager.markSaved(tabId)
    } else {
      const filePath = await window.api.saveFileDialog()
      if (!filePath) return
      await this.editorManager.migrateTemporaryImages(filePath)
      const content = this.editorManager.getContent(tabId)
      await window.api.writeFile(filePath, content)
      this.editorManager.markSaved(tabId, filePath)
    }
  }

  private registerBeforeClose(): void {
    window.api.onAppBeforeClose(async () => {
      const dirtyTabs = this.editorManager.getAllTabs().filter((t) => t.isDirty)

      for (const tab of dirtyTabs) {
        const choice = await window.api.showConfirmSave(tab.fileName)
        if (choice === 'cancel') {
          window.api.confirmClose(false)
          return
        }
        if (choice === 'save') {
          await this.saveSpecificTab(tab.id)
          const updated = this.editorManager.getTab(tab.id)
          if (updated?.isDirty) {
            window.api.confirmClose(false)
            return
          }
        }
      }

      window.api.confirmClose(true)
    })
  }

  private async loadSettings(): Promise<void> {
    this.currentSettings = await window.api.getSettings()
    this.editorManager.setInitialSettings(this.currentSettings)
    this.applyThemeToUI(this.currentSettings.theme)
  }

  private async openSettings(): Promise<void> {
    await this.settingsReady
    this.settingsPanel.toggle(this.currentSettings)
  }

  private async onSettingsChanged(settings: AppSettings): Promise<void> {
    this.currentSettings = settings
    this.editorManager.applySettings(settings)
    this.applyThemeToUI(settings.theme)
    await window.api.setSettings(settings)
  }

  private applyThemeToUI(theme: AppSettings['theme']): void {
    document.body.classList.toggle('theme-light', theme === 'light')
  }

  private async openRecent(path: string, type: 'file' | 'folder'): Promise<void> {
    if (type === 'folder') {
      await this.openFolder(path)
    } else {
      await this.openFile(path)
    }
  }

  private async loadRecentIntoWelcome(): Promise<void> {
    const container = document.getElementById('welcome-recent')
    if (!container) return

    const items = await window.api.getRecent()
    if (items.length === 0) {
      container.innerHTML = ''
      return
    }

    const home = items[0]?.path.match(/^(\/Users\/[^/]+|\/home\/[^/]+|[A-Z]:\\Users\\[^\\]+)/)?.[0] || ''

    const listHtml = items
      .slice(0, 5)
      .map((item) => {
        const name = item.path.split('/').pop() || item.path
        const dir = item.path.split('/').slice(0, -1).join('/')
        const shortDir = home ? dir.replace(home, '~') : dir
        return `<div class="recent-item" data-path="${item.path}" data-type="${item.type}">
          <span class="recent-name">${name}</span>
          <span class="recent-path">${shortDir}</span>
        </div>`
      })
      .join('')

    const header = `<div class="recent-header"><h3>Recent</h3></div>`
    container.innerHTML = `${header}<div class="recent-list">${listHtml}</div>`

    container.querySelectorAll('.recent-item').forEach((el) => {
      el.addEventListener('click', () => {
        const p = (el as HTMLElement).dataset.path!
        const t = (el as HTMLElement).dataset.type as 'file' | 'folder'
        this.openRecent(p, t)
      })
    })
  }

  private toggleSidebar(): void {
    this.sidebar.classList.toggle('hidden')
    localStorage.setItem('sidebarHidden', String(this.sidebar.classList.contains('hidden')))
    this.syncTrafficLightPadding()
  }

  private syncTrafficLightPadding(): void {
    const sidebarHidden = this.sidebar.classList.contains('hidden')
    this.tabBarEl.classList.toggle('no-sidebar', sidebarHidden)
  }

  private onEditorChange(): void {
    this.updateUI()
  }

  private updateUI(): void {
    const tabs = this.editorManager.getAllTabs()
    const activeTabId = this.editorManager.getActiveTabId()
    const activeTab = this.editorManager.getActiveTab()

    this.tabBar.render(tabs, activeTabId)

    if (activeTab) {
      this.welcomeScreen.style.display = 'none'
      this.statusBarEl.style.display = ''
      const cursor = this.editorManager.getCursorPosition()
      this.statusBar.update(cursor, activeTab.filePath)
      this.fileTree.setActiveFile(activeTab.filePath)

      const title = activeTab.isDirty
        ? `${activeTab.fileName} - modified - Subline`
        : `${activeTab.fileName} - Subline`
      window.api.setTitle(title)
    } else {
      this.welcomeScreen.style.display = 'flex'
      this.statusBarEl.style.display = 'none'
      this.statusBar.reset()
      this.fileTree.setActiveFile(null)
      window.api.setTitle('Subline')
      this.loadRecentIntoWelcome()
    }
  }
}
