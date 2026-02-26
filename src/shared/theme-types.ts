export interface ThemeUI {
  bgPrimary: string
  bgSecondary: string
  bgSidebar: string
  bgTab: string
  bgTabActive: string
  bgStatusbar: string
  bgHover: string
  bgSelection: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accent: string
  accentOrange: string
  accentPink: string
  accentBlue: string
  accentPurple: string
  border: string
  tabBorder: string
  scrollbarThumb: string
  scrollbarTrack: string
}

export interface ThemeEditor {
  background: string
  foreground: string
  cursor: string
  selection: string
  lineHighlight: string
}

export interface ThemeSyntax {
  comment: string
  keyword: string
  string: string
  number: string
  function: string
  variable: string
  type: string
  operator: string
  property: string
  tag: string
  attribute: string
}

export interface ThemeDefinition {
  id: string
  name: string
  type: 'dark' | 'light'
  ui: ThemeUI
  editor: ThemeEditor
  syntax: ThemeSyntax
}
