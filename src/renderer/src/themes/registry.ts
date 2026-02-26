import { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { ThemeDefinition, ThemeUI } from './types'
import { BUILTIN_THEMES } from './builtin'

let customThemes: ThemeDefinition[] = []

export function getBuiltinThemes(): ThemeDefinition[] {
  return BUILTIN_THEMES
}

export function setCustomThemes(themes: ThemeDefinition[]): void {
  customThemes = themes
}

export function getAllThemes(): ThemeDefinition[] {
  return [...BUILTIN_THEMES, ...customThemes]
}

export function getThemeById(id: string): ThemeDefinition | undefined {
  return getAllThemes().find((t) => t.id === id)
}

export function buildCMTheme(theme: ThemeDefinition): Extension {
  const isDark = theme.type === 'dark'

  const editorTheme = EditorView.theme(
    {
      '&': {
        color: theme.editor.foreground,
        backgroundColor: theme.editor.background
      },
      '.cm-content': {
        caretColor: theme.editor.cursor
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: theme.editor.cursor
      },
      '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        {
          backgroundColor: theme.editor.selection
        },
      '.cm-panels': {
        backgroundColor: theme.editor.background,
        color: theme.editor.foreground
      },
      '.cm-panels.cm-panels-top': {
        borderBottom: `1px solid ${theme.ui.border}`
      },
      '.cm-searchMatch': {
        backgroundColor: `${theme.syntax.string}30`,
        outline: `1px solid ${theme.syntax.string}50`
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: `${theme.editor.selection}`
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
        position: 'relative'
      },
      '.cm-activeLine::before': {
        content: '""',
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: theme.editor.lineHighlight,
        zIndex: -2,
        pointerEvents: 'none'
      },
      '.cm-selectionMatch': {
        backgroundColor: `${theme.editor.selection}80`
      },
      '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: `${theme.editor.selection}`,
        outline: `1px solid ${theme.ui.textMuted}`
      },
      '.cm-gutters': {
        backgroundColor: theme.editor.background,
        color: theme.ui.textMuted,
        borderRight: 'none'
      },
      '.cm-activeLineGutter': {
        backgroundColor: theme.editor.lineHighlight,
        color: theme.ui.textSecondary
      },
      '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: theme.ui.textMuted
      },
      '.cm-tooltip': {
        border: `1px solid ${theme.ui.border}`,
        backgroundColor: theme.ui.bgSecondary,
        color: theme.ui.textPrimary
      },
      '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
      },
      '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
          backgroundColor: theme.editor.selection,
          color: theme.editor.foreground
        }
      }
    },
    { dark: isDark }
  )

  const highlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: theme.syntax.comment, fontStyle: 'italic' },
    { tag: tags.lineComment, color: theme.syntax.comment, fontStyle: 'italic' },
    { tag: tags.blockComment, color: theme.syntax.comment, fontStyle: 'italic' },
    { tag: tags.docComment, color: theme.syntax.comment, fontStyle: 'italic' },
    { tag: tags.keyword, color: theme.syntax.keyword },
    { tag: tags.controlKeyword, color: theme.syntax.keyword },
    { tag: tags.operatorKeyword, color: theme.syntax.keyword },
    { tag: tags.definitionKeyword, color: theme.syntax.keyword },
    { tag: tags.moduleKeyword, color: theme.syntax.keyword },
    { tag: tags.string, color: theme.syntax.string },
    { tag: tags.special(tags.string), color: theme.syntax.string },
    { tag: tags.number, color: theme.syntax.number },
    { tag: tags.integer, color: theme.syntax.number },
    { tag: tags.float, color: theme.syntax.number },
    { tag: tags.bool, color: theme.syntax.number },
    { tag: tags.function(tags.variableName), color: theme.syntax.function },
    { tag: tags.function(tags.propertyName), color: theme.syntax.function },
    { tag: tags.variableName, color: theme.syntax.variable },
    { tag: tags.definition(tags.variableName), color: theme.syntax.variable },
    { tag: tags.typeName, color: theme.syntax.type },
    { tag: tags.className, color: theme.syntax.type },
    { tag: tags.namespace, color: theme.syntax.type },
    { tag: tags.operator, color: theme.syntax.operator },
    { tag: tags.punctuation, color: theme.editor.foreground },
    { tag: tags.propertyName, color: theme.syntax.property },
    { tag: tags.definition(tags.propertyName), color: theme.syntax.property },
    { tag: tags.tagName, color: theme.syntax.tag },
    { tag: tags.attributeName, color: theme.syntax.attribute },
    { tag: tags.attributeValue, color: theme.syntax.string },
    { tag: tags.regexp, color: theme.syntax.string },
    { tag: tags.escape, color: theme.syntax.number },
    { tag: tags.meta, color: theme.syntax.comment },
    { tag: tags.self, color: theme.syntax.variable },
    { tag: tags.null, color: theme.syntax.number },
    { tag: tags.atom, color: theme.syntax.number }
  ])

  return [editorTheme, syntaxHighlighting(highlightStyle)]
}

const UI_VAR_MAP: Record<keyof ThemeUI, string> = {
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgSidebar: '--bg-sidebar',
  bgTab: '--bg-tab',
  bgTabActive: '--bg-tab-active',
  bgStatusbar: '--bg-statusbar',
  bgHover: '--bg-hover',
  bgSelection: '--bg-selection',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  accent: '--accent',
  accentOrange: '--accent-orange',
  accentPink: '--accent-pink',
  accentBlue: '--accent-blue',
  accentPurple: '--accent-purple',
  border: '--border',
  tabBorder: '--tab-border',
  scrollbarThumb: '--scrollbar-thumb',
  scrollbarTrack: '--scrollbar-track'
}

export function applyCSSVariables(theme: ThemeDefinition): void {
  const root = document.documentElement
  for (const [key, cssVar] of Object.entries(UI_VAR_MAP)) {
    root.style.setProperty(cssVar, theme.ui[key as keyof ThemeUI])
  }
}
