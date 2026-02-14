export interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

export interface TabInfo {
  id: string
  filePath: string | null
  fileName: string
  isDirty: boolean
}

export interface ElectronAPI {
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  openFileDialog(): Promise<{ filePath: string; content: string } | null>
  openFolderDialog(): Promise<string | null>
  saveFileDialog(defaultPath?: string): Promise<string | null>
  readDirectoryTree(dirPath: string): Promise<FileTreeNode[]>
  onMenuNewFile(callback: () => void): void
  onMenuOpenFile(callback: () => void): void
  onMenuOpenFolder(callback: () => void): void
  onMenuSave(callback: () => void): void
  onMenuSaveAs(callback: () => void): void
  onMenuCloseTab(callback: () => void): void
  onMenuToggleSidebar(callback: () => void): void
  onMenuCommandPalette(callback: () => void): void
  setTitle(title: string): void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
