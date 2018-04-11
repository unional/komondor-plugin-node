import { callbackInvoked } from 'komondor'
import { Registrar, SpyContext, StubContext } from 'komondor-plugin'
import { Stream } from 'stream'
import { AtLeastOnce } from 'satisfier'

import { getFileIO } from './io'

const TYPE = 'node/stream'

export function streamConstructed() {
  return { type: TYPE, name: 'construct' }
}

export function streamReceivedMultipleData() {
  return new AtLeastOnce(callbackInvoked())
}

export function streamMethodInvoked(site: string[], ...args: any[]) {
  return { type: TYPE, name: 'invoke', payload: args, meta: { site } }
}
export function streamMethodReturned(site?: string[]) {
  return { type: TYPE, name: 'return', meta: { site } }
}

export function activate(registrar: Registrar) {
  const io = getFileIO('__komondor__')
  registrar.register(
    TYPE,
    subject => subject instanceof Stream,
    (context, subject) => spyStream(context, io, subject),
    (context) => stubStream(context, io)
  )
}

function spyStream(context: SpyContext, io, subject: Stream) {
  const instance = context.newInstance()
  const on = subject.on
  subject['on'] = function (event, listener) {
    const call = instance.newCall({ site: ['on'] })
    const spiedArgs = call.invoke([event, listener])
    on.call(subject, ...spiedArgs)
    call.return(undefined)
    return this
  }
  // const call = instance.newCall()

  // let writer: Writable
  // if (context.mode === 'save') {
  //   writer = io.createWriteStream(`${context.specId}/stream_${instance.instanceId}_${call.invokeId}`)
  // }
  // let length = 0
  // subject.on('data', chunk => {
  //   length += chunk.length
  //   if (writer) writer.write(chunk)
  // })
  // subject.on('end', () => {
  //   call.return([], { length })
  //   if (writer) writer.end()
  // })
  return subject
}

function stubStream(context: StubContext, io) {
  const instance = context.newInstance()
  return {
    on(event, listener) {
      const call = instance.newCall({ site: ['on'] })
      const wrap = (chunk) => {
        listener(chunk && chunk.type === 'Buffer' ? Buffer.from(chunk.data) : chunk)
      }
      call.invoked([event, wrap])
      call.blockUntilReturn()
      return call.result()
    }
  }
  // const call = instance.newCall()
  // const readStream: Stream = io.createReadStream(`${context.specId}/stream_${instance.instanceId}_${call.invokeId}`)
  // readStream.on('end', () => {
  //   call.result()
  // })

  // return readStream
}
