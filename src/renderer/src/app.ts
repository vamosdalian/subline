import { EditorManager } from './components/editor/editor-manager'
import { TabBar } from './components/editor/tab-bar'
import { FileTree } from './components/sidebar/file-tree'
import { StatusBar } from './components/status-bar'
import { CommandPalette, Command } from './components/command-palette'

export class App {
  private editorManager: EditorManager
  private tabBar: TabBar
  private fileTree: FileTree
  private statusBar: StatusBar
  private commandPalette: CommandPalette
  private sidebar: HTMLElement
  private tabBarEl: HTMLElement
  private editorContainer: HTMLElement
  private welcomeScreen: HTMLElement

  constructor() {
    this.sidebar = document.getElementById('sidebar')!
    this.tabBarEl = document.getElementById('tab-bar')!
    this.editorContainer = document.getElementById('editor-container')!
    this.welcomeScreen = document.getElementById('welcome')!

    this.editorManager = new EditorManager(this.editorContainer)
    this.tabBar = new TabBar(
      this.tabBarEl,
      (tabId) => this.selectTab(tabId),
      (tabId) => this.closeTab(tabId)
    )
    this.fileTree = new FileTree(document.getElementById('file-tree')!, (filePath) =>
      this.openFile(filePath)
    )
    this.statusBar = new StatusBar()
    this.commandPalette = new CommandPalette()

    this.editorManager.onChange(() => this.onEditorChange())
    this.registerMenuHandlers()
    this.registerCommands()
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
  }

  private async openFolderDialog(): Promise<void> {
    const folderPath = await window.api.openFolderDialog()
    if (!folderPath) return
    await this.fileTree.loadFolder(folderPath)
    this.sidebar.classList.remove('hidden')
    this.syncTrafficLightPadding()
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

  private closeTab(tabId: string): void {
    const result = this.editorManager.closeTab(tabId)
    this.updateUI()
    if (result) {
      this.editorManager.focus()
    }
  }

  private closeActiveTab(): void {
    const tabId = this.editorManager.getActiveTabId()
    if (tabId) this.closeTab(tabId)
  }

  private toggleSidebar(): void {
    this.sidebar.classList.toggle('hidden')
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
      const cursor = this.editorManager.getCursorPosition()
      this.statusBar.update(cursor, activeTab.filePath)
      this.fileTree.setActiveFile(activeTab.filePath)

      const title = activeTab.isDirty
        ? `${activeTab.fileName} - modified - Subline`
        : `${activeTab.fileName} - Subline`
      window.api.setTitle(title)
    } else {
      this.welcomeScreen.style.display = 'flex'
      this.statusBar.reset()
      this.fileTree.setActiveFile(null)
      window.api.setTitle('Subline')
    }
  }
}
