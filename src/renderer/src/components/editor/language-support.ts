import { LanguageDescription } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import type { Extension } from '@codemirror/state'
import { Compartment } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

// Languages whose default loader needs tweaking (e.g. nested highlighting).
const loadOverrides: Record<string, () => Promise<Extension>> = {
  Markdown: () =>
    import('@codemirror/lang-markdown').then((m) => m.markdown({ codeLanguages: languages }))
}

function basename(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('/').pop()!
}

function findLanguage(filePath: string | null): LanguageDescription | null {
  if (!filePath) return null
  return LanguageDescription.matchFilename(languages, basename(filePath))
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
  const desc = findLanguage(filePath)
  const override = desc ? loadOverrides[desc.name] : undefined

  let langExt: Extension = []
  if (desc) {
    langExt = await (override ? override() : desc.load())
  }

  if (isStale && isStale()) return
  view.dispatch({ effects: compartment.reconfigure(langExt) })
}

export function getLanguageName(filePath: string | null): string {
  return findLanguage(filePath)?.name || 'Plain Text'
}
