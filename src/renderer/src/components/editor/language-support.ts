import type { Extension } from '@codemirror/state'
import { Compartment } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

const languageLoaders: Record<string, () => Promise<Extension>> = {
  js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  jsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  ts: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  tsx: () =>
    import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true, jsx: true })),
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  htm: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  py: () => import('@codemirror/lang-python').then((m) => m.python()),
  md: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown())
}

const extToLanguageName: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  ts: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  json: 'JSON',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  py: 'Python',
  md: 'Markdown',
  markdown: 'Markdown',
  txt: 'Plain Text'
}

export function createLanguageCompartment(): { compartment: Compartment; extension: Extension } {
  const compartment = new Compartment()
  return { compartment, extension: compartment.of([]) }
}

export async function loadLanguage(
  filePath: string,
  view: EditorView,
  compartment: Compartment,
  isStale?: () => boolean
): Promise<void> {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const loader = languageLoaders[ext]
  if (!loader) return

  const langExt = await loader()
  if (isStale && isStale()) return
  view.dispatch({ effects: compartment.reconfigure(langExt) })
}

export function getLanguageName(filePath: string | null): string {
  if (!filePath) return 'Plain Text'
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return extToLanguageName[ext] || 'Plain Text'
}
