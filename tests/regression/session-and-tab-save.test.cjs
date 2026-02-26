const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

test('editor manager migrates temporary images for the requested tab', () => {
  const source = readSource('src/renderer/src/components/editor/editor-manager.ts')
  assert.match(source, /async migrateTemporaryImages\(filePath: string, tabId\?: string\)/)
  assert.match(source, /const targetTabId = tabId \|\| this\.activeTabId/)
  assert.match(source, /const tab = this\.tabs\.get\(targetTabId\)/)
  assert.match(source, /const state = isActiveTab && this\.view \? this\.view\.state : tab\.state/)
  assert.match(source, /tab\.state = tab\.state\.update\(\{ changes \}\)\.state/)
})

test('saving a specific tab passes tab id into temporary image migration', () => {
  const source = readSource('src/renderer/src/app.ts')
  assert.match(source, /await this\.editorManager\.migrateTemporaryImages\(tab\.filePath, tabId\)/)
  assert.match(source, /await this\.editorManager\.migrateTemporaryImages\(filePath, tabId\)/)
})

test('session APIs are exposed from preload and typed in shared contracts', () => {
  const preloadSource = readSource('src/preload/index.ts')
  const typesSource = readSource('src/shared/types.ts')
  const ipcSource = readSource('src/main/ipc-handlers.ts')

  assert.match(preloadSource, /getSession: \(\) => ipcRenderer\.invoke\('session:get'\)/)
  assert.match(preloadSource, /setSession: \(snapshot: SessionSnapshot\) => ipcRenderer\.invoke\('session:set', snapshot\)/)
  assert.match(preloadSource, /clearSession: \(\) => ipcRenderer\.invoke\('session:clear'\)/)

  assert.match(typesSource, /getSession\(\): Promise<SessionSnapshot \| null>/)
  assert.match(typesSource, /setSession\(snapshot: SessionSnapshot\): Promise<void>/)
  assert.match(typesSource, /clearSession\(\): Promise<void>/)

  assert.match(ipcSource, /const SESSION_PATH = join\(SETTINGS_DIR, 'session\.json'\)/)
  assert.match(ipcSource, /ipcMain\.handle\('session:get'/)
  assert.match(ipcSource, /ipcMain\.handle\('session:set'/)
  assert.match(ipcSource, /ipcMain\.handle\('session:clear'/)
})

test('app initializes from saved session and persists session snapshots', () => {
  const source = readSource('src/renderer/src/app.ts')
  assert.match(source, /this\.settingsReady = this\.initializeAppState\(\)/)
  assert.match(source, /const restored = await this\.restoreSession\(\)/)
  assert.match(source, /private schedulePersistSession\(\): void/)
  assert.match(source, /private async persistSession\(\): Promise<void>/)
  assert.match(source, /await this\.persistSession\(\)\s+window\.api\.confirmClose\(true\)/)
})
