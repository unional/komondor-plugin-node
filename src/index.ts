import { Registrar } from 'komondor-plugin'

import {
  activate as cpActivate,
  childProcessConstructed,
  childProcessInvoked,
  childProcessReturned
} from './childProcess'
import {
  activate as streamActivate,
  streamConstructed,
  streamMethodInvoked,
  streamMethodReturned,
  streamReceivedMultipleData
} from './stream'

export {
  childProcessConstructed,
  childProcessInvoked,
  childProcessReturned,
  streamConstructed,
  streamMethodInvoked,
  streamMethodReturned,
  streamReceivedMultipleData
}

export function activate(registrar: Registrar) {
  cpActivate(registrar)
  streamActivate(registrar)
}
