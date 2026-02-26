import { app } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export const SETTINGS_DIR = is.dev
  ? join(__dirname, '../../test')
  : app.getPath('userData')
