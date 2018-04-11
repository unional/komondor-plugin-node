import t from 'assert'
import { spec, functionConstructed, functionInvoked, functionReturned, callbackInvoked, promiseConstructed, promiseResolved } from 'komondor'
import { testSave, testSimulate } from 'komondor-test'
import stream from 'stream'

import { streamConstructed, streamMethodInvoked, streamMethodReturned, streamReceivedMultipleData } from '..'

function readStream(): stream.Stream {
  const rs = new stream.Readable()
  const message = 'hello world'
  let i = 0
  rs._read = function () {
    if (message[i])
      rs.push(message[i++])
    else
      rs.push(null)
  }
  return rs
}


test('acceptance', async () => {
  const s = await spec.simulate('stream/acceptance/helloWorld', readStream)
  const read = s.subject()
  let message = ''
  await new Promise(a => {
    read.on('data', chunk => message += chunk)
    read.on('end', () => a())
  })

  t.equal(message, 'hello world')

  await s.satisfy([
    { ...functionConstructed({ functionName: 'readStream' }), instanceId: 1 },
    { ...functionInvoked(), instanceId: 1, invokeId: 1 },
    { ...functionReturned(), instanceId: 1, invokeId: 1, returnType: 'node/stream', returnInstanceId: 1 },
    { ...streamConstructed(), instanceId: 1 },
    { ...streamMethodInvoked(['on'], 'data'), instanceId: 1, invokeId: 1 },
    { ...streamMethodReturned(['on']), instanceId: 1, invokeId: 1 },
    { ...streamMethodInvoked(['on'], 'end'), instanceId: 1, invokeId: 2 },
    { ...streamMethodReturned(['on']), instanceId: 1, invokeId: 2 },
    streamReceivedMultipleData(),
    { ...callbackInvoked(), sourceType: 'node/stream', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] }
  ])
})

async function simpleStreamTest(title, spec) {
  test(title, async () => {
    const s = await spec(readStream)
    const read = s.subject()
    let message = ''
    await new Promise(a => {
      read.on('data', chunk => message += chunk)
      read.on('end', () => a())
    })

    t.equal(message, 'hello world')

    await s.satisfy([
      { ...functionConstructed({ functionName: 'readStream' }), instanceId: 1 },
      { ...functionInvoked(), instanceId: 1, invokeId: 1 },
      { ...functionReturned(), instanceId: 1, invokeId: 1, returnType: 'node/stream', returnInstanceId: 1 },
      { ...streamConstructed(), instanceId: 1 },
      { ...streamMethodInvoked(['on'], 'data'), instanceId: 1, invokeId: 1 },
      { ...streamMethodReturned(['on']), instanceId: 1, invokeId: 1 },
      { ...streamMethodInvoked(['on'], 'end'), instanceId: 1, invokeId: 2 },
      { ...streamMethodReturned(['on']), instanceId: 1, invokeId: 2 },
      streamReceivedMultipleData(),
      { ...callbackInvoked(), sourceType: 'node/stream', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] }
    ])
  })
}

testSave('stream/save', simpleStreamTest)
testSimulate('stream/simulate', simpleStreamTest)


function promiseStream() {
  function readStream(): stream.Stream {
    const rs = new stream.Readable()
    const message = 'hello world'
    let i = 0
    rs._read = function () {
      if (message[i])
        rs.push(message[i++])
      else
        rs.push(null)
    }
    return rs
  }
  const read = readStream()
  return new Promise<stream.Stream>(a => {
    setImmediate(() => {
      a(read)
    })
  })
}
async function promiseReturnStreamTest(title, spec) {
  test(title, async () => {
    const target = await spec(promiseStream)
    const read = await target.subject()
    const actual = await new Promise(a => {
      let message = ''
      read.on('data', m => {
        message += m
      })
      read.on('end', () => {
        a(message)
      })
    })
    t.equal(actual, 'hello world')

    await target.satisfy([
      { ...functionConstructed({ functionName: 'promiseStream' }), instanceId: 1 },
      { ...functionInvoked(), instanceId: 1, invokeId: 1 },
      { ...functionReturned(), instanceId: 1, invokeId: 1, returnType: 'promise', returnInstanceId: 1 },
      { ...promiseConstructed(), instanceId: 1 },
      { ...promiseResolved(), instanceId: 1, invokeId: 1, returnType: 'node/stream', returnInstanceId: 1 },
      { ...streamConstructed(), instanceId: 1 },
      { ...streamMethodInvoked(['on'], 'data'), instanceId: 1, invokeId: 1 },
      { ...streamMethodReturned(['on']), instanceId: 1, invokeId: 1 },
      { ...streamMethodInvoked(['on'], 'end'), instanceId: 1, invokeId: 2 },
      { ...streamMethodReturned(['on']), instanceId: 1, invokeId: 2 },
      streamReceivedMultipleData(),
      { ...callbackInvoked(), sourceType: 'node/stream', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] }
    ])
  })
}
testSave('promise returning a stream', 'promise/readStream', promiseReturnStreamTest)
// this test uses `readStreamReplay` as source because it causes concurrency issue with the `save` test.
// It doesn't happen in actual usage as there should be only one test accessing one spec file.
testSimulate('promise returning a stream', 'promise/readStreamSimulate', promiseReturnStreamTest)
