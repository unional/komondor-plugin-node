import { Registrar, StubContext, SpyContext, SpyInstance } from 'komondor-plugin'

import { log } from '../log'

const TYPE = 'node/childProcess'
export function activate(registrar: Registrar) {
  registrar.register(
    TYPE,
    isChildProcess,
    spyChildProcess,
    stubChildProcess
  )
}

function isChildProcess(subject) {
  return subject && typeof subject.on === 'function' &&
    subject.stdout && typeof subject.stdout.on === 'function' &&
    subject.stderr && typeof subject.stderr.on === 'function'
}

function spyChildProcess(context: SpyContext, subject) {
  const instance = context.newInstance()
  spyOnListener(instance, TYPE, subject, ['on'])
  spyOnListener(instance, TYPE, subject, ['stdout', 'on'])
  spyOnListener(instance, TYPE, subject, ['stderr', 'on'])
  return subject
}

function spyOnListener(instance: SpyInstance, type: string, base, site: string[]) {
  const subject = site.reduce((p, v, i) => {
    if (i === site.length - 1)
      return p
    return p[v]
  }, base)
  const methodName = site[site.length - 1]
  const fn = subject[methodName]
  subject[methodName] = function (event, cb) {
    const wrap = (...args) => {
      const call = instance.newCall()
      call.invoke(args, { site, event })
      cb(...args)
    }
    return fn.call(subject, event, wrap)
  }
}

function stubChildProcess(context: StubContext) {
  const on = {}
  const stdout = {}
  const stderr = {}
  const instance = context.newInstance()
  const call = instance.newCall()

  setImmediate(() => {
    let action = call.peek()
    while (action && isChildProcessAction(action)) {
      const site = action.meta.site.join('.')
      let target
      switch (site) {
        case 'on':
          target = on
          break
        case 'stdout.on':
          target = stdout
          break
        case 'stderr.on':
          target = stderr
          break
      }

      target[action.meta.event].forEach(cb => cb(...action!.payload))
      call.next()
      action = call.peek()
    }
  })

  function push(bag, event, callback) {
    (bag[event] = bag[event] || []).push(callback)
  }
  return {
    on(event, callback) {
      log.debug('on()', event, callback)
      push(on, event, callback)
    },
    stdout: {
      on(event, callback) {
        log.debug('stdout.on()', event, callback)
        push(stdout, event, callback)
      }
    },
    stderr: {
      on(event, callback) {
        log.debug('stderr.on()', event, callback)
        push(stderr, event, callback)
      }
    }
  }
}

function isChildProcessAction(action) {
  return action.type === TYPE
}
