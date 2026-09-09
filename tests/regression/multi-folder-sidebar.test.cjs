const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

test('session snapshot carries the sidebar folder list and expansion state', () => {
  const source = readSource('src/shared/session.ts')
  assert.match(source, /folders: string\[\]/)
  assert.match(source, /expandedPaths: string\[\]/)
})

test('sessions written before multi-folder support still load', () => {
  const source = readSource('src/main/ipc-handlers.ts')
  assert.match(source, /if \(snapshot\.folders !== undefined && !isStringArray\(snapshot\.folders\)\) return false/)
  assert.match(
    source,
    /if \(snapshot\.expandedPaths !== undefined && !isStringArray\(snapshot\.expandedPaths\)\) return false/
  )
  assert.match(source, /folders: parsed\.folders \?\? \[\]/)
  assert.match(source, /expandedPaths: parsed\.expandedPaths \?\? \[\]/)
})

test('clearing the session resets folders as well as tabs', () => {
  const source = readSource('src/main/ipc-handlers.ts')
  assert.match(source, /tabs: \[\],\s+activeTabIndex: 0,\s+folders: \[\],\s+expandedPaths: \[\]/)
})

test('file tree manages several roots instead of a single folder', () => {
  const source = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  assert.match(source, /async addFolder\(folderPath: string\): Promise<boolean>/)
  assert.match(source, /removeFolder\(folderPath: string\): void/)
  assert.match(
    source,
    /async setFolders\(folderPaths: string\[\], expandedPaths: string\[\] = \[\]\): Promise<void>/
  )
  assert.match(source, /async refreshFolder\(folderPath: string\): Promise<void>/)
  assert.match(source, /getFolders\(\): string\[\]/)
  assert.match(source, /getExpandedPaths\(\): string\[\]/)
  assert.doesNotMatch(source, /loadFolder/)
})

test('file tree drops folders that no longer exist on disk', () => {
  const source = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  assert.match(source, /const loaded = await this\.loadTree\(path\)\s+if \(!loaded\) continue/)
  assert.match(source, /this\.trees\.delete\(folderPath\)\s+return false/)
})

test('expansion state survives re-rendering and is cleaned up on removal', () => {
  const source = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  assert.match(source, /private expanded = new Set<string>\(\)/)
  assert.match(source, /const isExpanded = this\.expanded\.has\(node\.path\)/)
  assert.match(source, /private forgetExpandedUnder\(folderPath: string\): void/)
  assert.match(source, /path === folderPath \|\| path\.startsWith\(`\$\{folderPath\}\/`\)/)
})

test('active file highlight covers duplicate paths under nested roots', () => {
  const source = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  assert.match(source, /querySelectorAll\(`\[data-path="\$\{CSS\.escape\(filePath\)\}"\]`\)/)
})

test('opening a folder appends it to the sidebar', () => {
  const source = readSource('src/renderer/src/app.ts')
  assert.match(source, /const added = await this\.fileTree\.addFolder\(folderPath\)/)
  assert.match(source, /if \(added\) this\.schedulePersistSession\(\)/)
  assert.match(source, /private removeFolder\(folderPath: string\): void/)
})

test('folders are restored even when the session has no tabs', () => {
  const source = readSource('src/renderer/src/app.ts')
  assert.match(
    source,
    /await this\.fileTree\.setFolders\(snapshot\.folders, snapshot\.expandedPaths\)/
  )
  assert.match(
    source,
    /const restored = snapshot\.tabs\.length > 0 && this\.editorManager\.restoreSession\(snapshot\)/
  )
})

test('session persistence tracks folder changes', () => {
  const source = readSource('src/renderer/src/app.ts')
  assert.match(source, /private buildSessionSnapshot\(\): SessionSnapshot/)
  assert.match(source, /folders: this\.fileTree\.getFolders\(\)/)
  assert.match(source, /expandedPaths: this\.fileTree\.getExpandedPaths\(\)/)
  assert.match(source, /folders: snapshot\.folders,\s+expandedPaths: \[\.\.\.snapshot\.expandedPaths\]\.sort\(\)/)
  assert.match(
    source,
    /if \(snapshot\.tabs\.length === 0 && snapshot\.folders\.length === 0\) \{/
  )
})

test('folder context menu is wired from main through preload', () => {
  const ipcSource = readSource('src/main/ipc-handlers.ts')
  const preloadSource = readSource('src/preload/index.ts')
  const typesSource = readSource('src/shared/types.ts')

  assert.match(ipcSource, /ipcMain\.handle\('folder:show-context-menu'/)
  assert.match(
    preloadSource,
    /showFolderContextMenu: \(\) => ipcRenderer\.invoke\('folder:show-context-menu'\)/
  )
  assert.match(typesSource, /export type FolderContextMenuAction = 'remove' \| 'reveal' \| 'refresh'/)
  assert.match(typesSource, /showFolderContextMenu\(\): Promise<FolderContextMenuAction \| null>/)
})

test('directory tree is read one level at a time', () => {
  const source = readSource('src/main/ipc-handlers.ts')
  assert.match(source, /async function buildTree\(dirPath: string, expandedPaths: Set<string>\)/)
  assert.match(
    source,
    /const children = expandedPaths\.has\(fullPath\)\s+\? await buildTree\(fullPath, expandedPaths\)\s+: undefined/
  )
  assert.doesNotMatch(source, /if \(depth > 10\) return \[\]/)
  assert.match(
    source,
    /ipcMain\.handle\('folder:read-tree', async \(_event, dirPath: string, expandedPaths\?: string\[\]\)/
  )
})

test('expanded paths travel with every directory read', () => {
  const typesSource = readSource('src/shared/types.ts')
  const preloadSource = readSource('src/preload/index.ts')
  const treeSource = readSource('src/renderer/src/components/sidebar/file-tree.ts')

  assert.match(
    typesSource,
    /readDirectoryTree\(dirPath: string, expandedPaths\?: string\[\]\): Promise<FileTreeNode\[\]>/
  )
  assert.match(preloadSource, /ipcRenderer\.invoke\('folder:read-tree', dirPath, expandedPaths\)/)
  assert.match(treeSource, /private expandedUnder\(folderPath: string\): string\[\]/)
  assert.match(treeSource, /readDirectoryTree\(folderPath, expanded\)/)
  assert.match(treeSource, /readDirectoryTree\(dirPath, this\.expandedUnder\(dirPath\)\)/)
})

test('expanding an unread directory fetches it once', () => {
  const source = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  assert.match(source, /private loading = new Set<string>\(\)/)
  assert.match(source, /if \(this\.loading\.has\(node\.path\)\) return false/)
  assert.match(source, /node\.children = await this\.fetchChildren\(node\.path\)/)
  assert.match(source, /this\.renderChildren\(childrenEl, node\.children, depth \+ 1\)/)
  // Already-read directories are served from the cached node.
  assert.match(source, /if \(!node\.children\) \{/)
})

test('directories use the inline lucide folder icon', () => {
  const iconSource = readSource('src/renderer/src/components/icons.ts')
  const treeSource = readSource('src/renderer/src/components/sidebar/file-tree.ts')

  assert.match(iconSource, /export function createFolderIcon\(\): SVGSVGElement/)
  assert.match(iconSource, /M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7\.9a2 2 0 0 1-1\.69-\.9/)
  assert.match(iconSource, /stroke: 'currentColor'/)

  // Both the root header and nested directories get the same icon.
  const uses = treeSource.match(/createFolderIcon\(\)/g) || []
  assert.equal(uses.length, 2)
  assert.doesNotMatch(treeSource, /icon\.textContent = isExpanded/)
})

test('expansion state is shown by the chevron, not the folder icon', () => {
  const treeSource = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  const cssSource = readSource('src/renderer/src/styles/sidebar.css')

  assert.match(treeSource, /chevron\.className = 'tree-item-chevron'/)
  assert.match(treeSource, /item\.classList\.add\('collapsed'\)/)
  assert.match(treeSource, /item\.classList\.remove\('collapsed'\)/)
  assert.match(cssSource, /\.tree-item\.collapsed \.tree-item-chevron \{\s+transform: rotate\(180deg\);/)
  assert.match(cssSource, /\.tree-root-header\.collapsed \.tree-root-chevron \{\s+transform: rotate\(180deg\);/)
})

test('open folder has a shortcut shown on the welcome screen', () => {
  const menuSource = readSource('src/main/menu.ts')
  const appSource = readSource('src/renderer/src/app.ts')
  const htmlSource = readSource('src/renderer/index.html')

  assert.match(menuSource, /label: 'Open Folder\.\.\.',\s+accelerator: 'CmdOrCtrl\+Shift\+O'/)
  assert.match(appSource, /id: 'file\.openFolder',\s+label: 'Open Folder\.\.\.',\s+shortcut: `\$\{mod\}\+Shift\+O`/)
  assert.match(htmlSource, /<kbd>Cmd\+Shift\+O<\/kbd> Open Folder/)
})
