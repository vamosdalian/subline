import { watch, type FSWatcher } from 'fs'
import type { WebContents } from 'electron'

const DEBOUNCE_MS = 150

interface WatchState {
  watchers: Map<string, FSWatcher>
  timers: Map<string, NodeJS.Timeout>
}

const states = new Map<WebContents, WatchState>()

function notify(sender: WebContents, state: WatchState, dirPath: string): void {
  const pending = state.timers.get(dirPath)
  if (pending) clearTimeout(pending)

  // A single save or `git checkout` fires a burst of events; report it once.
  state.timers.set(
    dirPath,
    setTimeout(() => {
      state.timers.delete(dirPath)
      if (!sender.isDestroyed()) sender.send('folder:changed', dirPath)
    }, DEBOUNCE_MS)
  )
}

function unwatch(state: WatchState, dirPath: string): void {
  state.watchers.get(dirPath)?.close()
  state.watchers.delete(dirPath)
}

function disposeState(sender: WebContents): void {
  const state = states.get(sender)
  if (!state) return

  state.watchers.forEach((watcher) => watcher.close())
  state.timers.forEach((timer) => clearTimeout(timer))
  states.delete(sender)
}

/**
 * Makes `dirPaths` the full set of directories watched on behalf of `sender`.
 * Each one is watched a single level deep, so the cost follows what the sidebar
 * actually shows rather than the size of the folder (think `node_modules`).
 */
export function setWatchedDirectories(sender: WebContents, dirPaths: string[]): void {
  let state = states.get(sender)
  if (!state) {
    state = { watchers: new Map(), timers: new Map() }
    states.set(sender, state)
    sender.once('destroyed', () => disposeState(sender))
  }

  const current = state
  const wanted = new Set(dirPaths)

  Array.from(current.watchers.keys()).forEach((dirPath) => {
    if (!wanted.has(dirPath)) unwatch(current, dirPath)
  })

  for (const dirPath of dirPaths) {
    if (current.watchers.has(dirPath)) continue

    try {
      const watcher = watch(dirPath, { persistent: false }, (eventType, filename) => {
        // 'change' is a content edit; only 'rename' adds or removes tree entries.
        if (eventType !== 'rename') return
        // Dotfiles are not listed in the tree.
        if (filename && filename.startsWith('.')) return
        notify(sender, current, dirPath)
      })

      watcher.on('error', () => {
        // Usually the directory itself is gone; let the renderer re-read and drop it.
        unwatch(current, dirPath)
        notify(sender, current, dirPath)
      })

      current.watchers.set(dirPath, watcher)
    } catch {
      // Deleted between the renderer listing it and us watching it.
    }
  }
}
