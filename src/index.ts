import { Registrar } from 'komondor-plugin'

import { activate as cpActivate } from './childProcess'
import { activate as streamActivate, streamReceivedAtLeast, streamReceivedExactly } from './stream'

export { streamReceivedAtLeast, streamReceivedExactly }

export function activate(registrar: Registrar) {
  cpActivate(registrar)
  streamActivate(registrar)
}
