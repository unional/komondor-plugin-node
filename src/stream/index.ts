import { Registrar, SpyContext, StubContext } from 'komondor-plugin'
import { Stream, Writable } from 'stream'

import { getFileIO } from './io'

const TYPE = 'node/stream'
export function activate(registrar: Registrar) {
  const io = getFileIO('__komondor__')
  registrar.register(
    TYPE,
    subject => subject instanceof Stream,
    // tslint:disable-next-line
    (context, subject) => spyStream(context, io, subject),
    // tslint:disable-next-line
    (context) => stubStream(context, io)
  )
}

function spyStream(context: SpyContext, io, subject: Stream) {
  const call = context.newCall()

  let writer: Writable
  if (context.mode === 'save') {
    writer = io.createWriteStream(`${context.specId}/stream_${context.instanceId}_${call.invokeId}`)
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
  const call = context.newCall()
  let action = call.peek()!
  const readStream = io.createReadStream(`${context.specId}/stream_${action.meta.instanceId}_${action.meta.invokeId}`)
  call.next()
  // context.on('node/stream', 'invoke', a => {
  //   if (a.meta.streamId === action.meta.streamId)
  //     context.next()
  // })

  return readStream
}
