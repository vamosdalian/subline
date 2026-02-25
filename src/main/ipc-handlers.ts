import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { readFile, writeFile, readdir, stat, mkdir, copyFile, unlink } from 'fs/promises'
import { join, basename, dirname } from 'path'
import { tmpdir, homedir } from 'os'
import { FileTreeNode } from '../shared/types'
import { AppSettings, DEFAULT_SETTINGS } from '../shared/settings'

const SETTINGS_DIR = join(homedir(), '.subline')
const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json')

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await mkdir(SETTINGS_DIR, { recursive: true })
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

async function buildTree(dirPath: string, depth = 0): Promise<FileTreeNode[]> {
  if (depth > 10) return []

  const entries = await readdir(dirPath, { withFileTypes: true })
  const nodes: FileTreeNode[] = []

  const sorted = entries
    .filter((e) => !e.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

  for (const entry of sorted) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const children = await buildTree(fullPath, depth + 1)
      nodes.push({ name: entry.name, path: fullPath, isDirectory: true, children })
    } else {
      nodes.push({ name: entry.name, path: fullPath, isDirectory: false })
    }
  }

  return nodes
}

export function registerIpcHandlers(): void {
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    return await readFile(filePath, 'utf-8')
  })

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('file:open-dialog', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'All Files', extensions: ['*'] }]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return { filePath, content }
  })

  ipcMain.handle('folder:open-dialog', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('file:save-dialog', async (_event, defaultPath?: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      defaultPath,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    })

    if (result.canceled || !result.filePath) return null
    return result.filePath
  })

  ipcMain.handle('folder:read-tree', async (_event, dirPath: string) => {
    return await buildTree(dirPath)
  })

  ipcMain.handle('image:save', async (_event, buffer: Uint8Array, dirPath: string) => {
    const imagesDir = join(dirPath, 'images')
    await mkdir(imagesDir, { recursive: true })
    const fileName = `${Date.now()}.png`
    await writeFile(join(imagesDir, fileName), buffer)
    return `./images/${fileName}`
  })

  ipcMain.handle('image:save-temp', async (_event, buffer: Uint8Array) => {
    const tempDir = join(tmpdir(), 'subline-images')
    await mkdir(tempDir, { recursive: true })
    const fileName = `${Date.now()}.png`
    const filePath = join(tempDir, fileName)
    await writeFile(filePath, buffer)
    return filePath
  })

  ipcMain.handle('image:migrate', async (_event, tempPath: string, targetDir: string) => {
    const imagesDir = join(targetDir, 'images')
    await mkdir(imagesDir, { recursive: true })
    const fileName = basename(tempPath)
    const targetPath = join(imagesDir, fileName)
    await copyFile(tempPath, targetPath)
    await unlink(tempPath)
    return `./images/${fileName}`
  })

  ipcMain.handle('shell:open-path', async (_event, filePath: string) => {
    await shell.openPath(filePath)
  })

  ipcMain.handle('settings:get', async () => {
    return await loadSettings()
  })

  ipcMain.handle('settings:set', async (_event, settings: AppSettings) => {
    await saveSettings(settings)
  })

  ipcMain.handle('dialog:confirm-save', async (_event, fileName: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return 'discard'

    const result = await dialog.showMessageBox(win, {
      type: 'warning',
      message: `Do you want to save changes to "${fileName}"?`,
      detail: 'Your changes will be lost if you don\'t save them.',
      buttons: ['Don\'t Save', 'Cancel', 'Save'],
      defaultId: 2,
      cancelId: 1,
      noLink: true
    })

    if (result.response === 2) return 'save'
    if (result.response === 0) return 'discard'
    return 'cancel'
  })

  ipcMain.on('set-title', (event, title: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.setTitle(title)
  })
}
