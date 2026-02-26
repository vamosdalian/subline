export interface AppSettings {
  theme: string
  fontFamily: string
  fontSize: number
  tabSize: number
  indentWithTabs: boolean
  autoRenderImages: boolean
  hideImageUrl: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'one-dark',
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: 14,
  tabSize: 2,
  indentWithTabs: false,
  autoRenderImages: true,
  hideImageUrl: false
}
