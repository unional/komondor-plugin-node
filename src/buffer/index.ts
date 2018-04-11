import { Registrar } from 'komondor-plugin'

const TYPE = 'node/Buffer'

export function activate(registrar: Registrar) {
  registrar.register(
    TYPE,
    subject => subject instanceof Buffer,
    (context, subject) => subject,
    (context) => {}
  )
}
