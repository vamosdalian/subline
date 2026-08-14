const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const widgetFile = path.resolve(
  process.cwd(),
  'src/renderer/src/components/editor/image-widget.ts'
)

function readWidgetSource() {
  return fs.readFileSync(widgetFile, 'utf8')
}

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

test('image widget uses stable CodeMirror measurement API', () => {
  const source = readWidgetSource()
  assert.match(source, /EditorView\.findFromDOM\(wrapper\)/)
  assert.match(source, /view\.requestMeasure\(\)/)
  assert.ok(!source.includes('cmView?.view?.requestMeasure()'))
})

test('image widget binds load handler before setting src', () => {
  const source = readWidgetSource()
  const onloadPos = source.indexOf('img.onload = triggerMeasure')
  const srcPos = source.indexOf("img.src = 'local-file://' + encodeURI(resolvedPath)")

  assert.notEqual(onloadPos, -1, 'expected onload assignment')
  assert.notEqual(srcPos, -1, 'expected src assignment')
  assert.ok(onloadPos < srcPos, 'onload must be set before src')
})

test('image widget triggers a measurement after appending image node', () => {
  const source = readWidgetSource()
  assert.match(source, /wrapper\.appendChild\(img\)\s+triggerMeasure\(\)/)
})

test('image widget exposes all image context menu actions', () => {
  const source = readWidgetSource()
  assert.match(source, /addEventListener\('contextmenu'/)
  assert.match(source, /showImageContextMenu\(\)/)
  assert.match(source, /case 'open':/)
  assert.match(source, /case 'reveal':/)
  assert.match(source, /case 'copy-image':/)
  assert.match(source, /case 'copy-path':/)
  assert.match(source, /case 'copy-markdown':/)
  assert.match(source, /case 'delete-reference':/)
  assert.match(source, /case 'delete-file':/)
})

test('deleting an image reference uses a CodeMirror transaction', () => {
  const source = readWidgetSource()
  assert.match(source, /doc\.sliceString\(this\.from, this\.to\) !== this\.markdown/)
  assert.match(source, /view\.dispatch\(\{ changes: \{ from, to, insert: '' \} \}\)/)
})

test('main process builds the complete native image menu', () => {
  const source = readSource('src/main/ipc-handlers.ts')
  for (const label of [
    '打开图片',
    '在 Finder 中显示',
    '复制图片',
    '复制图片路径',
    '复制 Markdown',
    '删除图片引用',
    '删除图片引用和本地文件'
  ]) {
    assert.ok(source.includes(`label: '${label}'`), `missing menu item: ${label}`)
  }
  assert.match(source, /Menu\.buildFromTemplate/)
  assert.match(source, /clipboard\.writeImage\(image\)/)
  assert.match(source, /shell\.showItemInFolder\(filePath\)/)
  assert.match(source, /await unlink\(filePath\)/)
  assert.match(source, /if \(result\.response !== 1\) return false/)
})

test('image menu APIs are exposed through the preload contract', () => {
  const preload = readSource('src/preload/index.ts')
  const types = readSource('src/shared/types.ts')

  assert.match(preload, /showImageContextMenu: \(\) => ipcRenderer\.invoke\('image:show-context-menu'\)/)
  assert.match(preload, /copyImage: \(filePath: string\) => ipcRenderer\.invoke\('image:copy', filePath\)/)
  assert.match(preload, /deleteImageFile: \(filePath: string\) => ipcRenderer\.invoke\('image:delete-file', filePath\)/)
  assert.match(types, /showImageContextMenu\(\): Promise<ImageContextMenuAction \| null>/)
  assert.match(types, /deleteImageFile\(filePath: string\): Promise<boolean>/)
})
