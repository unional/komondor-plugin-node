import { Registrar, SpyContext, StubContext } from 'komondor-plugin'
import { Stream, Writable } from 'stream'

import { getFileIO } from './io'

const TYPE = 'node/stream'

export function streamReceivedAtLeast(length: number) {
  return { type: TYPE, meta: { length: len => len > length } }
}
export function streamReceivedExactly(length: number) {
  return { type: TYPE, meta: { length: len => len === length } }
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
  const call = instance.newCall()

  let writer: Writable
  if (context.mode === 'save') {
    writer = io.createWriteStream(`${context.specId}/stream_${instance.instanceId}_${call.invokeId}`)
  }
  let length = 0
  subject.on('data', chunk => {
    length += chunk.length
    if (writer) writer.write(chunk)
  })
  subject.on('end', () => {
    call.invoke([], { length })
    if (writer) writer.end()
  })
  return subject
}

function stubStream(context: StubContext, io): Stream {
  const instance = context.newInstance()
  const call = instance.newCall()
  let action = call.peek()!
  const readStream = io.createReadStream(`${context.specId}/stream_${action.instanceId}_${action.invokeId}`)
  call.next()

  return readStream
}
