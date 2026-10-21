import assert from 'node:assert/strict'
import test from 'node:test'
import { scrollToSearchTarget } from '../src/modules/home/searchNavigation.ts'

const mobileFixture = () => {
  let documentTop = 2400
  let pending: (() => void) | undefined
  const calls: number[] = []
  const browser = {
    pageYOffset: 0,
    scrollTo(x: number, y: number) {
      assert.equal(x, 0)
      assert.equal(typeof y, 'number')
      this.pageYOffset = y
      calls.push(y)
    },
    setTimeout(callback: () => void, delay: number) {
      assert.equal(delay, 350)
      pending = callback
      return 1
    },
    clearTimeout() { pending = undefined },
  }
  const target = {
    isConnected: true,
    getBoundingClientRect: () => ({ top: documentTop - browser.pageYOffset }),
    scrollIntoView: () => { throw new Error('QQ smooth scrolling is unavailable') },
  }
  return {
    browser: browser as unknown as Window,
    target: target as unknown as HTMLElement,
    calls,
    moveTarget(top: number) { documentTop = top },
    closeKeyboard() { browser.pageYOffset = 0 },
    runTimer() { pending?.() },
  }
}

test('mobile uses numeric scrolling and restores the target after keyboard resize resets scroll', () => {
  const fixture = mobileFixture()
  scrollToSearchTarget(fixture.target, true, fixture.browser)
  assert.deepEqual(fixture.calls, [2382])
  fixture.closeKeyboard()
  fixture.moveTarget(2600)
  fixture.runTimer()
  assert.deepEqual(fixture.calls, [2382, 2582])
})

test('a cancelled navigation cannot pull the user back to an old target', () => {
  const fixture = mobileFixture()
  const cancel = scrollToSearchTarget(fixture.target, true, fixture.browser)
  cancel()
  fixture.runTimer()
  assert.deepEqual(fixture.calls, [2382])
})

test('a removed target is not scrolled to after keyboard dismissal', () => {
  const fixture = mobileFixture()
  scrollToSearchTarget(fixture.target, true, fixture.browser)
  Object.defineProperty(fixture.target, 'isConnected', { value: false })
  fixture.runTimer()
  assert.deepEqual(fixture.calls, [2382])
})

test('desktop keeps smooth scrolling and respects reduced motion', () => {
  for (const reduceMotion of [false, true]) {
    const calls: unknown[] = []
    const target = { scrollIntoView: (options: unknown) => calls.push(options) } as unknown as HTMLElement
    const browser = { matchMedia: () => ({ matches: reduceMotion }) } as unknown as Window
    scrollToSearchTarget(target, false, browser)
    assert.deepEqual(calls, [{ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }])
  }
})
