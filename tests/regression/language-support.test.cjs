const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { LanguageDescription } = require('@codemirror/language')
const { languages } = require('@codemirror/language-data')

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

test('language support resolves files through the shared language-data table', () => {
  const source = readSource('src/renderer/src/components/editor/language-support.ts')
  assert.match(source, /import \{ languages \} from '@codemirror\/language-data'/)
  assert.match(source, /LanguageDescription\.matchFilename\(languages, basename\(filePath\)\)/)
})

test('markdown keeps highlighting fenced code blocks', () => {
  const source = readSource('src/renderer/src/components/editor/language-support.ts')
  assert.match(source, /Markdown: \(\) =>/)
  assert.match(source, /m\.markdown\(\{ codeLanguages: languages \}\)/)
})

test('an unknown extension clears the language instead of keeping the previous one', () => {
  const source = readSource('src/renderer/src/components/editor/language-support.ts')
  assert.match(source, /let langExt: Extension = \[\]/)
  assert.match(source, /compartment\.reconfigure\(langExt\)/)
})

test('file types declared in fileAssociations all have a language', () => {
  const pkg = JSON.parse(readSource('package.json'))
  const declared = pkg.build.fileAssociations.map((a) => a.ext)
  const unmatched = declared.filter(
    (ext) => !['txt', 'log'].includes(ext) && !LanguageDescription.matchFilename(languages, `f.${ext}`)
  )
  assert.deepEqual(unmatched, [])
})

test('common extensions resolve to the expected language', () => {
  const cases = {
    'a.js': 'JavaScript',
    'a.tsx': 'TSX',
    'a.py': 'Python',
    'a.sql': 'SQL',
    'a.yaml': 'YAML',
    'a.rs': 'Rust',
    'a.go': 'Go',
    'a.sh': 'Shell',
    Dockerfile: 'Dockerfile'
  }
  for (const [file, expected] of Object.entries(cases)) {
    const desc = LanguageDescription.matchFilename(languages, file)
    assert.equal(desc && desc.name, expected, `${file} should map to ${expected}`)
  }
  assert.equal(LanguageDescription.matchFilename(languages, 'a.txt'), null)
})
