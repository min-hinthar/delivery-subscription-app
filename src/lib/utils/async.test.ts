import { describe, it, expect, vi } from 'vitest'
import { withTimeout } from './async'

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const fastPromise = Promise.resolve('success')
    const result = await withTimeout(fastPromise, 1000)
    expect(result).toBe('success')
  })

  it('rejects when promise takes longer than timeout', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('too slow'), 2000)
    })

    await expect(
      withTimeout(slowPromise, 100, 'Custom timeout message')
    ).rejects.toThrow('Custom timeout message')
  })

  it('uses default timeout message', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('too slow'), 2000)
    })

    await expect(
      withTimeout(slowPromise, 100)
    ).rejects.toThrow('Request timed out.')
  })

  it('uses default timeout of 10 seconds', async () => {
    const fastPromise = Promise.resolve('quick')
    const result = await withTimeout(fastPromise)
    expect(result).toBe('quick')
  })

  it('clears timeout after promise resolves', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const promise = Promise.resolve('done')

    await withTimeout(promise, 1000)

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('handles promise rejection', async () => {
    const rejectingPromise = Promise.reject(new Error('Promise failed'))

    await expect(
      withTimeout(rejectingPromise, 1000)
    ).rejects.toThrow('Promise failed')
  })

  it('works with async functions', async () => {
    const asyncFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
      return 'async result'
    }

    const result = await withTimeout(asyncFn(), 1000)
    expect(result).toBe('async result')
  })

  it('rejects with timeout even if original promise never resolves', async () => {
    const neverResolve = new Promise(() => {
      // Never resolves or rejects
    })

    await expect(
      withTimeout(neverResolve, 100, 'Timeout!')
    ).rejects.toThrow('Timeout!')
  })
})
