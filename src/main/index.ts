import { app, BrowserWindow, shell, protocol, net, nativeImage, ipcMain } from 'electron'
import { existsSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, isAbsolute, resolve } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers, loadRecentItems } from './ipc-handlers'
import { buildMenu } from './menu'

protocol.registerSchemesAsPrivileged([
  { scheme: 'local-file', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true } }
])

let mainWindow: BrowserWindow | null = null
let rendererReady = false
const pendingOpenFiles = new Set<string>()
const gotSingleInstanceLock = app.requestSingleInstanceLock()

function normalizeOpenFilePath(rawPath: string): string | null {
  if (!rawPath || rawPath.startsWith('-')) return null

  try {
    const candidate = rawPath.startsWith('file://') ? fileURLToPath(rawPath) : rawPath
    const fullPath = isAbsolute(candidate) ? candidate : resolve(candidate)
    if (!existsSync(fullPath)) return null
    if (!statSync(fullPath).isFile()) return null
    return fullPath
  } catch {
    return null
  }
}

function extractOpenFilesFromArgv(argv: string[]): string[] {
  const startIndex = process.defaultApp ? 2 : 1
  const files: string[] = []
  const seen = new Set<string>()

  for (const arg of argv.slice(startIndex)) {
    const fullPath = normalizeOpenFilePath(arg)
    if (!fullPath || seen.has(fullPath)) continue
    seen.add(fullPath)
    files.push(fullPath)
  }

  return files
}

function enqueueOpenFiles(filePaths: string[]): void {
  if (filePaths.length === 0) return
  for (const filePath of filePaths) {
    pendingOpenFiles.add(filePath)
  }
  flushPendingOpenFiles()
}

function flushPendingOpenFiles(): void {
  if (!mainWindow || !rendererReady) return
  if (pendingOpenFiles.size === 0) return

  const files = Array.from(pendingOpenFiles)
  pendingOpenFiles.clear()
  mainWindow.webContents.send('app:open-files', files)
}

function createWindow(): void {
  const isMac = process.platform === 'darwin'
  rendererReady = false

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: is.dev
      ? join(__dirname, '../../resources/icon.png')
      : join(process.resourcesPath, 'icon.png'),
    ...(isMac
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 12, y: 10 } }
      : {}),
    backgroundColor: '#272822',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  let forceClose = false

  mainWindow.on('close', (event) => {
    if (forceClose) return

    event.preventDefault()
    mainWindow!.webContents.send('app:before-close')
  })

  ipcMain.on('app:close-response', (_event, canClose: boolean) => {
    if (canClose && mainWindow) {
      forceClose = true
      mainWindow.close()
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    rendererReady = false
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  ipcMain.on('app:renderer-ready', () => {
    rendererReady = true
    flushPendingOpenFiles()
  })

  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    const fullPath = normalizeOpenFilePath(filePath)
    if (!fullPath) return
    enqueueOpenFiles([fullPath])
  })

  app.on('second-instance', (_event, argv) => {
    enqueueOpenFiles(extractOpenFilesFromArgv(argv))

    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(async () => {
    protocol.handle('local-file', (request) => {
      const pathPart = request.url.slice('local-file://'.length)
      return net.fetch('file://' + pathPart)
    })

    if (process.platform === 'darwin') {
      const iconPath = is.dev
        ? join(__dirname, '../../resources/icon.png')
        : join(process.resourcesPath, 'icon.png')
      const icon = nativeImage.createFromPath(iconPath)
      app.dock.setIcon(icon)
    }

    registerIpcHandlers()
    const recent = await loadRecentItems()
    buildMenu(recent)
    createWindow()

    if (process.platform !== 'darwin') {
      enqueueOpenFiles(extractOpenFilesFromArgv(process.argv))
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
