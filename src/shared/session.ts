export interface SessionTabSnapshot {
  filePath: string | null
  fileName: string
  content: string
  isDirty: boolean
  cursorOffset: number
}

export interface SessionSnapshot {
  tabs: SessionTabSnapshot[]
  activeTabIndex: number
  folders: string[]
  expandedPaths: string[]
  updatedAt: number
}
