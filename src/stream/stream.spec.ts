import t from 'assert'
import { testSave, testSimulate } from 'komondor-test'
import stream from 'stream'
import { spec } from 'komondor';
import { streamReceivedAtLeast, streamReceivedExactly } from '..'

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
  const s = await spec(readStream)
  const read = s.subject()
  await new Promise(a => {
    read.on('end', () => a())
  })

  await s.satisfy([
    undefined,
    undefined,
    streamReceivedAtLeast(10)
  ])

  await s.satisfy([
    undefined,
    undefined,
    streamReceivedExactly(11)
  ])
})

async function simpleStreamTest(title, spec) {
  test(title, async () => {
    const s = await spec(readStream)
    const read = s.subject()
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

    await s.satisfy([
      undefined,
      { type: 'function', name: 'return', instanceId: 1, invokeId: 1, returnType: 'node/stream', returnInstanceId: 1 },
      { type: 'node/stream', meta: { length: 11 }, instanceId: 1, invokeId: 1 }
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
      undefined,
      undefined,
      { type: 'promise', name: 'return', meta: { status: 'resolve' }, returnType: 'node/stream', returnInstanceId: 1 },
      { type: 'node/stream', meta: { length: 11 }, instanceId: 1 }
    ])
  })
}
testSave('promise returning a stream', 'promise/readStream', promiseReturnStreamTest)
// this test uses `readStreamReplay` as source because it causes concurrency issue with the `save` test.
// It doesn't happen in actual usage as there should be only one test accessing one spec file.
testSimulate('promise returning a stream', 'promise/readStreamSimulate', promiseReturnStreamTest)
