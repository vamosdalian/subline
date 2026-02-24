export interface AppSettings {
  theme: 'one-dark' | 'light'
  fontFamily: string
  fontSize: number
  tabSize: number
  indentWithTabs: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'one-dark',
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: 14,
  tabSize: 2,
  indentWithTabs: false
}
