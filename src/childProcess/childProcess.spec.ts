import t from 'assert'
import { testTrio } from 'komondor-test'

const childProcess = {
  increment(remote, x) {
    return new Promise((a, r) => {
      const result: any[] = []
      const cp = remote('increment', [x])
      cp.on('close', code => a({ result, code }))
      cp.on('error', err => r(err))
      cp.stdout.on('data', chunk => {
        result.push(['stdout', chunk])
      })
      cp.stderr.on('data', chunk => {
        result.push(['stderr', chunk])
      })
    })
  },
  spawnSuccess(_cmd, args) {
    let x = args[0]
    const stdout: any = {}
    const stderr: any = {}
    const cp: any = {}
    setImmediate(() => {
      stdout.data(++x)
      stdout.data(++x)
      stdout.data(++x)
      cp.close(0)
    })
    return {
      stdout: {
        on(event, callback) {
          stdout[event] = callback
        }
      },
      stderr: {
        on(event, callback) {
          stderr[event] = callback
        }
      },
      on(event, callback) {
        cp[event] = callback
      }
    }
  },
  spawnFail(_cmd, args) {
    let x = args[0]
    const stdout: any = {}
    const stderr: any = {}
    const cp: any = {}
    setImmediate(() => {
      stdout.data(++x)
      stderr.data(++x)
      cp.close(1)
    })
    return {
      stdout: {
        on(event, callback) {
          stdout[event] = callback
        }
      },
      stderr: {
        on(event, callback) {
          stderr[event] = callback
        }
      },
      on(event, callback) {
        cp[event] = callback
      }
    }
  }
}

testTrio('childProcess/success', async spec => {
  const s = await spec(childProcess.spawnSuccess)
  const actual = await childProcess.increment(s.subject, 2)
  t.deepEqual(actual, {
    result: [['stdout', 3], ['stdout', 4], ['stdout', 5]],
    code: 0
  })

  await s.satisfy([
    { type: 'function', name: 'invoke', payload: ['increment', [2]], meta: { instanceId: 1, invokeId: 1 } },
    { type: 'function', name: 'return', payload: {}, meta: { instanceId: 1, invokeId: 1, returnType: 'node/childProcess', returnInstanceId: 1 } },
    { type: 'node/childProcess', name: 'invoke', payload: [3], meta: { instanceId: 1, invokeId: 1, site: ['stdout', 'on'], event: 'data' } },
    { type: 'node/childProcess', name: 'invoke', payload: [4], meta: { instanceId: 1, invokeId: 2, site: ['stdout', 'on'], event: 'data' } },
    { type: 'node/childProcess', name: 'invoke', payload: [5], meta: { instanceId: 1, invokeId: 3, site: ['stdout', 'on'], event: 'data' } },
    { type: 'node/childProcess', name: 'invoke', payload: [0], meta: { instanceId: 1, invokeId: 4, site: ['on'], event: 'close' } }
  ])
})


testTrio('childProcess/fail', async spec => {
  const s = await spec(childProcess.spawnFail)
  const actual = await childProcess.increment(s.subject, 2)
  t.deepEqual(actual, {
    result: [['stdout', 3], ['stderr', 4]],
    code: 1
  })
  await s.satisfy([
    { type: 'function', name: 'invoke', payload: ['increment', [2]], meta: { instanceId: 1, invokeId: 1 } },
    { type: 'function', name: 'return', payload: {}, meta: { instanceId: 1, invokeId: 1, returnType: 'node/childProcess', returnInstanceId: 1 } },
    { type: 'node/childProcess', name: 'invoke', payload: [3], meta: { instanceId: 1, invokeId: 1, site: ['stdout', 'on'], event: 'data' } },
    { type: 'node/childProcess', name: 'invoke', payload: [4], meta: { instanceId: 1, invokeId: 2, site: ['stderr', 'on'], event: 'data' } },
    { type: 'node/childProcess', name: 'invoke', payload: [1], meta: { instanceId: 1, invokeId: 3, site: ['on'], event: 'close' } }
  ])
})
