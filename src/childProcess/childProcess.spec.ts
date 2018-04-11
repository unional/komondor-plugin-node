import t from 'assert'
import { testTrio } from 'komondor-test'
import { functionConstructed, functionInvoked, functionReturned, callbackInvoked } from 'komondor'
import { childProcessConstructed, childProcessInvoked, childProcessReturned } from '.';
// import cp from 'child_process'

// describe('acceptance test', () => {
//   testLive('childProcess/acceptance/spawn', (title, spec) => {
//     test.only(title, async () => {
//       const s = await spec(cp.spawn)
//       const child = s.subject('node', ['--version'])
//       console.log(child)
//       child.on('close', () => console.log('closed'))
//       child.stdout.on('data', chunk => console.log('data', chunk.toString()))
//     })
//   })
// })


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

testTrio('childProcess/success', (title, spec) => {
  test(title, async () => {
    const s = await spec(childProcess.spawnSuccess)
    const actual = await childProcess.increment(s.subject, 2)
    t.deepEqual(actual, {
      result: [['stdout', 3], ['stdout', 4], ['stdout', 5]],
      code: 0
    })

    await s.satisfy([
      { ...functionConstructed({ functionName: 'spawnSuccess' }), instanceId: 1 },
      { ...functionInvoked('increment', [2]), instanceId: 1, invokeId: 1 },
      { ...functionReturned(), instanceId: 1, invokeId: 1, returnType: 'node/childProcess', returnInstanceId: 1 },
      { ...childProcessConstructed(), instanceId: 1 },
      { ...childProcessInvoked(['on'], 'close'), instanceId: 1, invokeId: 1 },
      { ...childProcessReturned(['on']), instanceId: 1, invokeId: 1 },
      { ...childProcessInvoked(['on'], 'error'), instanceId: 1, invokeId: 2 },
      { ...childProcessReturned(['on']), instanceId: 1, invokeId: 2 },
      { ...childProcessInvoked(['stdout', 'on'], 'data'), instanceId: 1, invokeId: 3 },
      { ...childProcessReturned(['stdout', 'on']), instanceId: 1, invokeId: 3 },
      { ...childProcessInvoked(['stderr', 'on'], 'data'), instanceId: 1, invokeId: 4 },
      { ...childProcessReturned(['stderr', 'on']), instanceId: 1, invokeId: 4 },
      { ...callbackInvoked(3), sourceType: 'node/childProcess', sourceInstanceId: 1, sourceInvokeId: 3, sourcePath: [1] },
      { ...callbackInvoked(4), sourceType: 'node/childProcess', sourceInstanceId: 1, sourceInvokeId: 3, sourcePath: [1] },
      { ...callbackInvoked(5), sourceType: 'node/childProcess', sourceInstanceId: 1, sourceInvokeId: 3, sourcePath: [1] }
    ])
  })
})


testTrio('childProcess/fail', (title, spec) => {
  test(title, async () => {
    const s = await spec(childProcess.spawnFail)
    const actual = await childProcess.increment(s.subject, 2)
    t.deepEqual(actual, {
      result: [['stdout', 3], ['stderr', 4]],
      code: 1
    })
    await s.satisfy([
      { ...functionConstructed({ functionName: 'spawnFail' }), instanceId: 1 },
      { ...functionInvoked('increment', [2]), instanceId: 1, invokeId: 1 },
      { ...functionReturned(), instanceId: 1, invokeId: 1, returnType: 'node/childProcess', returnInstanceId: 1 },
      { ...childProcessConstructed(), instanceId: 1 },
      { ...childProcessInvoked(['on'], 'close'), instanceId: 1, invokeId: 1 },
      { ...childProcessReturned(['on']), instanceId: 1, invokeId: 1 },
      { ...childProcessInvoked(['on'], 'error'), instanceId: 1, invokeId: 2 },
      { ...childProcessReturned(['on']), instanceId: 1, invokeId: 2 },
      { ...childProcessInvoked(['stdout', 'on'], 'data'), instanceId: 1, invokeId: 3 },
      { ...childProcessReturned(['stdout', 'on']), instanceId: 1, invokeId: 3 },
      { ...childProcessInvoked(['stderr', 'on'], 'data'), instanceId: 1, invokeId: 4 },
      { ...childProcessReturned(['stderr', 'on']), instanceId: 1, invokeId: 4 },
      { ...callbackInvoked(3), sourceType: 'node/childProcess', sourceInstanceId: 1, sourceInvokeId: 3, sourcePath: [1] },
      { ...callbackInvoked(4), sourceType: 'node/childProcess', sourceInstanceId: 1, sourceInvokeId: 4, sourcePath: [1] },
      { ...callbackInvoked(1), sourceType: 'node/childProcess', sourceInstanceId: 1, sourceInvokeId: 1, sourcePath: [1] }
    ])
  })
})
