import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types'

const api: ElectronAPI = {
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('folder:open-dialog'),
  saveFileDialog: (defaultPath?: string) => ipcRenderer.invoke('file:save-dialog', defaultPath),
  readDirectoryTree: (dirPath: string) => ipcRenderer.invoke('folder:read-tree', dirPath),

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
  setTitle: (title: string) => {
    ipcRenderer.send('set-title', title)
  }
}

contextBridge.exposeInMainWorld('api', api)
