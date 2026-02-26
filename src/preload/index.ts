import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types'
import type { AppSettings } from '../shared/settings'
import type { RecentItem } from '../shared/types'

const api: ElectronAPI = {
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('folder:open-dialog'),
  saveFileDialog: (defaultPath?: string) => ipcRenderer.invoke('file:save-dialog', defaultPath),
  readDirectoryTree: (dirPath: string) => ipcRenderer.invoke('folder:read-tree', dirPath),
  saveImage: (buffer: Uint8Array, dirPath: string) =>
    ipcRenderer.invoke('image:save', buffer, dirPath),
  saveImageTemp: (buffer: Uint8Array) => ipcRenderer.invoke('image:save-temp', buffer),
  migrateImage: (tempPath: string, targetDir: string) =>
    ipcRenderer.invoke('image:migrate', tempPath, targetDir),
  openPath: (filePath: string) => ipcRenderer.invoke('shell:open-path', filePath),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:set', settings),
  getCustomThemes: () => ipcRenderer.invoke('themes:list-custom'),
  openThemesFolder: () => ipcRenderer.invoke('themes:open-folder'),
  getRecent: () => ipcRenderer.invoke('recent:get'),
  addRecent: (path: string, type: RecentItem['type']) => ipcRenderer.invoke('recent:add', path, type),
  clearRecent: () => ipcRenderer.invoke('recent:clear'),
  showConfirmSave: (fileName: string) => ipcRenderer.invoke('dialog:confirm-save', fileName),
  onAppBeforeClose: (callback: () => void) => {
    ipcRenderer.on('app:before-close', callback)
  },
  confirmClose: (canClose: boolean) => {
    ipcRenderer.send('app:close-response', canClose)
  },

  onMenuNewFile: (callback: () => void) => {
    ipcRenderer.on('menu:new-file', callback)
  },
  onMenuOpenFile: (callback: () => void) => {
    ipcRenderer.on('menu:open-file', callback)
  },
  onMenuOpenFolder: (callback: () => void) => {
    ipcRenderer.on('menu:open-folder', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu:save', callback)
  },
  onMenuSaveAs: (callback: () => void) => {
    ipcRenderer.on('menu:save-as', callback)
  },
  onMenuCloseTab: (callback: () => void) => {
    ipcRenderer.on('menu:close-tab', callback)
  },
  onMenuToggleSidebar: (callback: () => void) => {
    ipcRenderer.on('menu:toggle-sidebar', callback)
  },
  onMenuCommandPalette: (callback: () => void) => {
    ipcRenderer.on('menu:command-palette', callback)
  },
  onMenuOpenSettings: (callback: () => void) => {
    ipcRenderer.on('menu:open-settings', callback)
  },
  onMenuOpenRecent: (callback: (path: string, type: RecentItem['type']) => void) => {
    ipcRenderer.on('menu:open-recent', (_event, path: string, type: RecentItem['type']) => callback(path, type))
  },
  setTitle: (title: string) => {
    ipcRenderer.send('set-title', title)
  }
}

contextBridge.exposeInMainWorld('api', api)
