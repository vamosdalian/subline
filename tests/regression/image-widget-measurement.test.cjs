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
