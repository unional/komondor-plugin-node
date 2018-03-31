import { Registrar } from 'komondor-plugin'

import { activate as cpActivate } from './childProcess'
import { activate as streamActivate } from './stream'

export function activate(registrar: Registrar) {
  cpActivate(registrar)
  streamActivate(registrar)
}
