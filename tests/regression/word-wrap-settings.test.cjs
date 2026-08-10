const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

test('word wrap is part of persisted application settings', () => {
  const source = readSource('src/shared/settings.ts')

  assert.match(source, /wordWrap: boolean/)
  assert.match(source, /wordWrap: false/)
})

test('settings panel exposes and persists the word wrap control', () => {
  const source = readSource('src/renderer/src/components/settings-panel.ts')

  assert.match(source, /<span class="settings-label">Word Wrap<\/span>/)
  assert.match(source, /this\.settings\.wordWrap = wordWrapSelect\.value === 'on'/)
  assert.match(source, /s\.wordWrap \? 'on' : 'off'/)
})

test('editor manager reconfigures word wrapping for every open tab', () => {
  const source = readSource('src/renderer/src/components/editor/editor-manager.ts')

  assert.match(source, /private wordWrapCompartment = new Compartment\(\)/)
  assert.match(source, /settings\.wordWrap \? EditorView\.lineWrapping : \[\]/)
  assert.match(source, /for \(const tab of this\.tabs\.values\(\)\)/)
  assert.match(source, /tab\.state = tab\.state\.update\(\{ effects: this\.buildSettingsEffects\(settings\) \}\)\.state/)
})
