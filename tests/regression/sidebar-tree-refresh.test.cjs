const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const ts = require('typescript')

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

/** Compiles the watcher on the fly; it only needs Electron for types. */
function loadFolderWatcher() {
  const { outputText } = ts.transpileModule(readSource('src/main/folder-watcher.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  })
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(require, mod, mod.exports)
  return mod.exports
}

function createSender() {
  const sender = new EventEmitter()
  sender.sent = []
  sender.destroyed = false
  sender.isDestroyed = () => sender.destroyed
  sender.send = (channel, dirPath) => sender.sent.push([channel, dirPath])
  sender.destroy = () => {
    sender.destroyed = true
    sender.emit('destroyed')
  }
  return sender
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitFor(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await wait(25)
  }
  return predicate()
}

test('watcher reports added and removed entries, once per burst', async (t) => {
  const { setWatchedDirectories } = loadFolderWatcher()
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'subline-watch-')))
  const sender = createSender()
  t.after(() => {
    sender.destroy()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  setWatchedDirectories(sender, [dir])
  await wait(200)

  fs.writeFileSync(path.join(dir, 'a.txt'), '')
  fs.writeFileSync(path.join(dir, 'b.txt'), '')
  assert.ok(await waitFor(() => sender.sent.length > 0), 'creating files is reported')
  await wait(400)
  assert.deepEqual(sender.sent, [['folder:changed', dir]])

  sender.sent.length = 0
  fs.rmSync(path.join(dir, 'a.txt'))
  assert.ok(await waitFor(() => sender.sent.length > 0), 'deleting a file is reported')
})

test('watcher ignores dotfiles and directories it was told to drop', async (t) => {
  const { setWatchedDirectories } = loadFolderWatcher()
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'subline-watch-')))
  const sender = createSender()
  t.after(() => {
    sender.destroy()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  setWatchedDirectories(sender, [dir])
  await wait(200)
  fs.writeFileSync(path.join(dir, '.hidden'), '')
  await wait(500)
  assert.deepEqual(sender.sent, [])

  setWatchedDirectories(sender, [])
  fs.writeFileSync(path.join(dir, 'visible.txt'), '')
  await wait(500)
  assert.deepEqual(sender.sent, [])
})

test('watching a missing directory does not throw', () => {
  const { setWatchedDirectories } = loadFolderWatcher()
  const sender = createSender()
  assert.doesNotThrow(() =>
    setWatchedDirectories(sender, [path.join(os.tmpdir(), 'subline-watch-missing-dir')])
  )
  sender.destroy()
})

test('watch channel is wired from the renderer to the main process', () => {
  const preload = readSource('src/preload/index.ts')
  assert.match(preload, /ipcRenderer\.send\('folder:watch', dirPaths\)/)
  assert.match(preload, /ipcRenderer\.on\('folder:changed', listener\)/)

  const handlers = readSource('src/main/ipc-handlers.ts')
  assert.match(handlers, /ipcMain\.on\('folder:watch'/)
  assert.match(handlers, /setWatchedDirectories\(event\.sender, dirPaths\)/)
})

test('file tree re-reads the affected roots and keeps its watch list in sync', () => {
  const source = readSource('src/renderer/src/components/sidebar/file-tree.ts')
  assert.match(source, /window\.api\.onDirectoryChanged\(\(dirPath\) => this\.handleDirectoryChanged\(dirPath\)\)/)
  assert.match(source, /dirPath === folder \|\| dirPath\.startsWith\(`\$\{folder\}\/`\)/)
  assert.match(source, /private render\(\): void \{\s+this\.syncWatchers\(\)/)
  assert.match(source, /window\.api\.watchDirectories\(watched\)/)
  // Collapsed folders are unwatched, so their cached children must not be reused.
  assert.match(source, /node\.children = undefined/)
  assert.match(source, /this\.container\.scrollTop = scrollTop/)
})
