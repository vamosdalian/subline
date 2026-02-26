import { ipcMain, dialog, BrowserWindow, shell } from 'electron'
import { readFile, writeFile, readdir, stat, mkdir, copyFile, unlink } from 'fs/promises'
import { join, basename, dirname } from 'path'
import { tmpdir } from 'os'
import { FileTreeNode, RecentItem } from '../shared/types'
import { AppSettings, DEFAULT_SETTINGS } from '../shared/settings'
import type { ThemeDefinition } from '../shared/theme-types'
import type { SessionSnapshot } from '../shared/session'
import { buildMenu } from './menu'
import { SETTINGS_DIR } from './paths'

const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json')
const RECENT_PATH = join(SETTINGS_DIR, 'recent.json')
const THEMES_DIR = join(SETTINGS_DIR, 'themes')
const SESSION_PATH = join(SETTINGS_DIR, 'session.json')
const MAX_RECENT = 20

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

export async function loadRecentItems(): Promise<RecentItem[]> {
  try {
    const raw = await readFile(RECENT_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function saveRecentItems(items: RecentItem[]): Promise<void> {
  await mkdir(SETTINGS_DIR, { recursive: true })
  await writeFile(RECENT_PATH, JSON.stringify(items, null, 2), 'utf-8')
}

function isValidSessionSnapshot(value: unknown): value is SessionSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as SessionSnapshot
  if (!Array.isArray(snapshot.tabs)) return false
  if (typeof snapshot.activeTabIndex !== 'number') return false
  if (typeof snapshot.updatedAt !== 'number') return false

  return snapshot.tabs.every((tab) => {
    if (!tab || typeof tab !== 'object') return false
    if (tab.filePath !== null && typeof tab.filePath !== 'string') return false
    return (
      typeof tab.fileName === 'string' &&
      typeof tab.content === 'string' &&
      typeof tab.isDirty === 'boolean' &&
      typeof tab.cursorOffset === 'number'
    )
  })
}

async function loadSessionSnapshot(): Promise<SessionSnapshot | null> {
  try {
    const raw = await readFile(SESSION_PATH, 'utf-8')
    const parsed: unknown = JSON.parse(raw)
    return isValidSessionSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

async function saveSessionSnapshot(snapshot: SessionSnapshot): Promise<void> {
  await mkdir(SETTINGS_DIR, { recursive: true })
  await writeFile(SESSION_PATH, JSON.stringify(snapshot, null, 2), 'utf-8')
}

async function clearSessionSnapshot(): Promise<void> {
  await saveSessionSnapshot({
    tabs: [],
    activeTabIndex: 0,
    updatedAt: Date.now()
  })
}

async function addRecentItem(path: string, type: RecentItem['type']): Promise<RecentItem[]> {
  let items = await loadRecentItems()
  items = items.filter((i) => i.path !== path)
  items.unshift({ path, type, timestamp: Date.now() })
  if (items.length > MAX_RECENT) items = items.slice(0, MAX_RECENT)
  await saveRecentItems(items)
  return items
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

  ipcMain.handle('recent:get', async () => {
    return await loadRecentItems()
  })

  ipcMain.handle('recent:add', async (_event, path: string, type: RecentItem['type']) => {
    const items = await addRecentItem(path, type)
    buildMenu(items)
  })

  ipcMain.handle('recent:clear', async () => {
    await saveRecentItems([])
    buildMenu([])
  })

  ipcMain.handle('session:get', async () => {
    return await loadSessionSnapshot()
  })

  ipcMain.handle('session:set', async (_event, snapshot: SessionSnapshot) => {
    if (!isValidSessionSnapshot(snapshot)) return
    await saveSessionSnapshot(snapshot)
  })

  ipcMain.handle('session:clear', async () => {
    await clearSessionSnapshot()
  })

  ipcMain.handle('themes:list-custom', async () => {
    return await loadCustomThemes()
  })

  ipcMain.handle('themes:open-folder', async () => {
    await mkdir(THEMES_DIR, { recursive: true })
    shell.openPath(THEMES_DIR)
  })

  ipcMain.on('set-title', (event, title: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.setTitle(title)
  })
}

async function loadCustomThemes(): Promise<ThemeDefinition[]> {
  try {
    await mkdir(THEMES_DIR, { recursive: true })
    const entries = await readdir(THEMES_DIR)
    const themes: ThemeDefinition[] = []

    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue
      try {
        const raw = await readFile(join(THEMES_DIR, entry), 'utf-8')
        const parsed = JSON.parse(raw)
        if (parsed.name && parsed.type && parsed.ui && parsed.editor && parsed.syntax) {
          parsed.id = parsed.id || entry.replace('.json', '')
          themes.push(parsed as ThemeDefinition)
        }
      } catch {
        // skip malformed theme files
      }
    }

    return themes
  } catch {
    return []
  }
}
