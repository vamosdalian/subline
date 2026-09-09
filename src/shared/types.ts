export interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  /** Undefined means the directory has not been read yet; [] means it is empty. */
  children?: FileTreeNode[]
}

export interface TabInfo {
  id: string
  filePath: string | null
  fileName: string
  isDirty: boolean
}

export interface RecentItem {
  path: string
  type: 'file' | 'folder'
  timestamp: number
}

export type ImageContextMenuAction =
  | 'open'
  | 'reveal'
  | 'copy-image'
  | 'copy-path'
  | 'copy-markdown'
  | 'delete-reference'
  | 'delete-file'

export type FolderContextMenuAction = 'remove' | 'reveal' | 'refresh'

import type { AppSettings } from './settings'
import type { ThemeDefinition } from './theme-types'
import type { SessionSnapshot } from './session'

export interface ElectronAPI {
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  openFileDialog(): Promise<{ filePath: string; content: string } | null>
  openFolderDialog(): Promise<string | null>
  saveFileDialog(defaultPath?: string): Promise<string | null>
  readDirectoryTree(dirPath: string, expandedPaths?: string[]): Promise<FileTreeNode[]>
  saveImage(buffer: Uint8Array, dirPath: string): Promise<string>
  saveImageTemp(buffer: Uint8Array): Promise<string>
  migrateImage(tempPath: string, targetDir: string): Promise<string>
  openPath(filePath: string): Promise<void>
  revealPath(filePath: string): Promise<void>
  showImageContextMenu(): Promise<ImageContextMenuAction | null>
  showFolderContextMenu(): Promise<FolderContextMenuAction | null>
  copyImage(filePath: string): Promise<boolean>
  writeClipboardText(text: string): Promise<void>
  deleteImageFile(filePath: string): Promise<boolean>
  startImageDrag(filePath: string): void
  getSettings(): Promise<AppSettings>
  setSettings(settings: AppSettings): Promise<void>
  getCustomThemes(): Promise<ThemeDefinition[]>
  openThemesFolder(): Promise<void>
  getRecent(): Promise<RecentItem[]>
  addRecent(path: string, type: RecentItem['type']): Promise<void>
  clearRecent(): Promise<void>
  getSession(): Promise<SessionSnapshot | null>
  setSession(snapshot: SessionSnapshot): Promise<void>
  clearSession(): Promise<void>
  showConfirmSave(fileName: string): Promise<'save' | 'discard' | 'cancel'>
  onAppBeforeClose(callback: () => void): void
  onAppOpenFiles(callback: (filePaths: string[]) => void): () => void
  notifyRendererReady(): void
  confirmClose(canClose: boolean): void
  onMenuNewFile(callback: () => void): void
  onMenuOpenFile(callback: () => void): void
  onMenuOpenFolder(callback: () => void): void
  onMenuSave(callback: () => void): void
  onMenuSaveAs(callback: () => void): void
  onMenuCloseTab(callback: () => void): void
  onMenuToggleSidebar(callback: () => void): void
  onMenuCommandPalette(callback: () => void): void
  onMenuOpenSettings(callback: () => void): void
  onMenuOpenRecent(callback: (path: string, type: RecentItem['type']) => void): void
  setTitle(title: string): void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
