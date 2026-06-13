import {
  checkPlaygroundAllowance,
  incrementDailyGenerationCount,
  getDailyGenerationCount,
  FREE_DAILY_LIMIT,
  ADMIN_DAILY_LIMIT,
} from '@/app/lib/playground-usage'

describe('playground-usage', () => {
  const testId = `test-user-${Date.now()}`

  test('free user starts with 0 generations', async () => {
    const count = await getDailyGenerationCount(testId)
    expect(count).toBe(0)
  })

  test('increment returns new count', async () => {
    const count1 = await incrementDailyGenerationCount(testId)
    expect(count1).toBeGreaterThanOrEqual(1)

    const count2 = await incrementDailyGenerationCount(testId)
    expect(count2).toBe(count1 + 1)
  })

  test('checkPlaygroundAllowance returns correct remaining for free user', async () => {
    const freshId = `test-allowance-${Date.now()}`
    const allowance = await checkPlaygroundAllowance(freshId, false)
    expect(allowance.allowed).toBe(true)
    expect(allowance.remaining).toBe(FREE_DAILY_LIMIT)
    expect(allowance.limit).toBe(FREE_DAILY_LIMIT)
  })

  test('checkPlaygroundAllowance blocks after limit reached', async () => {
    const freshId = `test-block-${Date.now()}`
    for (let i = 0; i < FREE_DAILY_LIMIT; i++) {
      await incrementDailyGenerationCount(freshId)
    }
    const allowance = await checkPlaygroundAllowance(freshId, false)
    expect(allowance.allowed).toBe(false)
    expect(allowance.remaining).toBe(0)
  })

  test('paid user always allowed', async () => {
    const paidId = `test-paid-${Date.now()}`
    for (let i = 0; i < 10; i++) {
      await incrementDailyGenerationCount(paidId)
    }
    const allowance = await checkPlaygroundAllowance(paidId, true)
    expect(allowance.allowed).toBe(true)
    expect(allowance.remaining).toBe(Infinity)
    expect(allowance.limit).toBe(Infinity)
  })

  test('admin user gets higher limit', async () => {
    const adminId = `test-admin-${Date.now()}`
    // Use up free limit
    for (let i = 0; i < FREE_DAILY_LIMIT; i++) {
      await incrementDailyGenerationCount(adminId)
    }
    // Admin should still be allowed (up to ADMIN_DAILY_LIMIT)
    const allowance = await checkPlaygroundAllowance(adminId, false, true)
    expect(allowance.allowed).toBe(true)
    expect(allowance.limit).toBe(ADMIN_DAILY_LIMIT)
  })

  test('admin user blocked after admin limit', async () => {
    const adminMaxId = `test-admin-max-${Date.now()}`
    for (let i = 0; i < ADMIN_DAILY_LIMIT; i++) {
      await incrementDailyGenerationCount(adminMaxId)
    }
    const allowance = await checkPlaygroundAllowance(adminMaxId, false, true)
    expect(allowance.allowed).toBe(false)
    expect(allowance.remaining).toBe(0)
  })

  test('different users have isolated counts', async () => {
    const userA = `test-isolate-a-${Date.now()}`
    const userB = `test-isolate-b-${Date.now()}`
    await incrementDailyGenerationCount(userA)
    await incrementDailyGenerationCount(userA)
    await incrementDailyGenerationCount(userB)

    const countA = await getDailyGenerationCount(userA)
    const countB = await getDailyGenerationCount(userB)
    expect(countA).toBe(2)
    expect(countB).toBe(1)
    expect(countA).not.toBe(countB)
  })

  test('constants are correct', () => {
    expect(FREE_DAILY_LIMIT).toBe(3)
    expect(ADMIN_DAILY_LIMIT).toBe(50)
    expect(ADMIN_DAILY_LIMIT).toBeGreaterThan(FREE_DAILY_LIMIT)
  })
})
