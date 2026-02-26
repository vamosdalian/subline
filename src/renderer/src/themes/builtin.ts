import type { ThemeDefinition } from './types'

export const oneDark: ThemeDefinition = {
  id: 'one-dark',
  name: 'One Dark',
  type: 'dark',
  ui: {
    bgPrimary: '#282c34',
    bgSecondary: '#21252b',
    bgSidebar: '#21252b',
    bgTab: '#21252b',
    bgTabActive: '#282c34',
    bgStatusbar: '#21252b',
    bgHover: '#2c313a',
    bgSelection: '#3e4451',
    textPrimary: '#abb2bf',
    textSecondary: '#828997',
    textMuted: '#5c6370',
    accent: '#98c379',
    accentOrange: '#d19a66',
    accentPink: '#e06c75',
    accentBlue: '#61afef',
    accentPurple: '#c678dd',
    border: '#3e4451',
    tabBorder: '#181a1f',
    scrollbarThumb: '#4b5263',
    scrollbarTrack: 'transparent'
  },
  editor: {
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selection: '#3e4451',
    lineHighlight: '#2c313a'
  },
  syntax: {
    comment: '#7f848e',
    keyword: '#c678dd',
    string: '#98c379',
    number: '#d19a66',
    function: '#61afef',
    variable: '#e06c75',
    type: '#e5c07b',
    operator: '#56b6c2',
    property: '#e06c75',
    tag: '#e06c75',
    attribute: '#d19a66'
  }
}

export const monokaiPro: ThemeDefinition = {
  id: 'monokai-pro',
  name: 'Monokai Pro',
  type: 'dark',
  ui: {
    bgPrimary: '#2d2a2e',
    bgSecondary: '#221f22',
    bgSidebar: '#221f22',
    bgTab: '#221f22',
    bgTabActive: '#2d2a2e',
    bgStatusbar: '#221f22',
    bgHover: '#3b383e',
    bgSelection: '#4a474d',
    textPrimary: '#fcfcfa',
    textSecondary: '#939293',
    textMuted: '#727072',
    accent: '#a9dc76',
    accentOrange: '#fc9867',
    accentPink: '#ff6188',
    accentBlue: '#78dce8',
    accentPurple: '#ab9df2',
    border: '#403e41',
    tabBorder: '#19181a',
    scrollbarThumb: '#5b595c',
    scrollbarTrack: 'transparent'
  },
  editor: {
    background: '#2d2a2e',
    foreground: '#fcfcfa',
    cursor: '#fcfcfa',
    selection: '#4a474d',
    lineHighlight: '#363337'
  },
  syntax: {
    comment: '#727072',
    keyword: '#ff6188',
    string: '#ffd866',
    number: '#ab9df2',
    function: '#a9dc76',
    variable: '#fcfcfa',
    type: '#78dce8',
    operator: '#ff6188',
    property: '#78dce8',
    tag: '#ff6188',
    attribute: '#fc9867'
  }
}

export const dracula: ThemeDefinition = {
  id: 'dracula',
  name: 'Dracula',
  type: 'dark',
  ui: {
    bgPrimary: '#282a36',
    bgSecondary: '#21222c',
    bgSidebar: '#21222c',
    bgTab: '#21222c',
    bgTabActive: '#282a36',
    bgStatusbar: '#191a21',
    bgHover: '#343746',
    bgSelection: '#44475a',
    textPrimary: '#f8f8f2',
    textSecondary: '#9ea0ab',
    textMuted: '#6272a4',
    accent: '#50fa7b',
    accentOrange: '#ffb86c',
    accentPink: '#ff79c6',
    accentBlue: '#8be9fd',
    accentPurple: '#bd93f9',
    border: '#44475a',
    tabBorder: '#191a21',
    scrollbarThumb: '#565969',
    scrollbarTrack: 'transparent'
  },
  editor: {
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    selection: '#44475a',
    lineHighlight: '#2e303e'
  },
  syntax: {
    comment: '#6272a4',
    keyword: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    function: '#50fa7b',
    variable: '#f8f8f2',
    type: '#8be9fd',
    operator: '#ff79c6',
    property: '#66d9ef',
    tag: '#ff79c6',
    attribute: '#50fa7b'
  }
}

export const githubDark: ThemeDefinition = {
  id: 'github-dark',
  name: 'GitHub Dark',
  type: 'dark',
  ui: {
    bgPrimary: '#0d1117',
    bgSecondary: '#010409',
    bgSidebar: '#010409',
    bgTab: '#010409',
    bgTabActive: '#0d1117',
    bgStatusbar: '#010409',
    bgHover: '#161b22',
    bgSelection: '#1f2937',
    textPrimary: '#e6edf3',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    accent: '#3fb950',
    accentOrange: '#d29922',
    accentPink: '#f47067',
    accentBlue: '#58a6ff',
    accentPurple: '#bc8cff',
    border: '#30363d',
    tabBorder: '#010409',
    scrollbarThumb: '#484f58',
    scrollbarTrack: 'transparent'
  },
  editor: {
    background: '#0d1117',
    foreground: '#e6edf3',
    cursor: '#58a6ff',
    selection: '#1f2937',
    lineHighlight: '#161b22'
  },
  syntax: {
    comment: '#8b949e',
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    function: '#d2a8ff',
    variable: '#ffa657',
    type: '#ff7b72',
    operator: '#ff7b72',
    property: '#79c0ff',
    tag: '#7ee787',
    attribute: '#79c0ff'
  }
}

export const githubLight: ThemeDefinition = {
  id: 'github-light',
  name: 'GitHub Light',
  type: 'light',
  ui: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f6f8fa',
    bgSidebar: '#f6f8fa',
    bgTab: '#f6f8fa',
    bgTabActive: '#ffffff',
    bgStatusbar: '#f6f8fa',
    bgHover: '#eaeef2',
    bgSelection: '#d0d7de',
    textPrimary: '#1f2328',
    textSecondary: '#656d76',
    textMuted: '#8c959f',
    accent: '#1a7f37',
    accentOrange: '#9a6700',
    accentPink: '#cf222e',
    accentBlue: '#0969da',
    accentPurple: '#8250df',
    border: '#d0d7de',
    tabBorder: '#d0d7de',
    scrollbarThumb: '#afb8c1',
    scrollbarTrack: 'transparent'
  },
  editor: {
    background: '#ffffff',
    foreground: '#1f2328',
    cursor: '#0969da',
    selection: '#ddf4ff',
    lineHighlight: '#f6f8fa'
  },
  syntax: {
    comment: '#6e7781',
    keyword: '#cf222e',
    string: '#0a3069',
    number: '#0550ae',
    function: '#8250df',
    variable: '#953800',
    type: '#cf222e',
    operator: '#cf222e',
    property: '#0550ae',
    tag: '#116329',
    attribute: '#0550ae'
  }
}

export const nord: ThemeDefinition = {
  id: 'nord',
  name: 'Nord',
  type: 'dark',
  ui: {
    bgPrimary: '#2e3440',
    bgSecondary: '#272c36',
    bgSidebar: '#272c36',
    bgTab: '#272c36',
    bgTabActive: '#2e3440',
    bgStatusbar: '#272c36',
    bgHover: '#3b4252',
    bgSelection: '#434c5e',
    textPrimary: '#d8dee9',
    textSecondary: '#9da5b4',
    textMuted: '#6b7280',
    accent: '#a3be8c',
    accentOrange: '#d08770',
    accentPink: '#bf616a',
    accentBlue: '#88c0d0',
    accentPurple: '#b48ead',
    border: '#3b4252',
    tabBorder: '#222730',
    scrollbarThumb: '#4c566a',
    scrollbarTrack: 'transparent'
  },
  editor: {
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    selection: '#434c5e',
    lineHighlight: '#353b47'
  },
  syntax: {
    comment: '#616e88',
    keyword: '#81a1c1',
    string: '#a3be8c',
    number: '#b48ead',
    function: '#88c0d0',
    variable: '#d8dee9',
    type: '#8fbcbb',
    operator: '#81a1c1',
    property: '#88c0d0',
    tag: '#81a1c1',
    attribute: '#8fbcbb'
  }
}

export const BUILTIN_THEMES: ThemeDefinition[] = [
  oneDark,
  monokaiPro,
  dracula,
  githubDark,
  githubLight,
  nord
]
