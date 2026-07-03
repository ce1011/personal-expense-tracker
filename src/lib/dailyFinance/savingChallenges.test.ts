import { describe, expect, test } from 'vitest'

import {
  addSavingToChallenge,
  createChallenge,
  getActiveChallenges,
  type ChallengeProgress,
} from './savingChallenges'
import type { SavingChallenge, SavingRecord } from '@/types/app-data'

describe('createChallenge', () => {
  test('returns an active challenge starting at zero', () => {
    const now = 1_718_000_000_000
    const challenge = createChallenge('Emergency fund', 5_000, now)

    expect(challenge).toEqual({
      challenge_id: expect.stringContaining('challenge-') as string,
      name: 'Emergency fund',
      target_amount: 5_000,
      current_amount: 0,
      status: 'active',
      created_at: now,
      updated_at: now,
    } satisfies SavingChallenge)
  })
})

describe('addSavingToChallenge', () => {
  test('increments current amount and keeps status active when below target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Travel',
      target_amount: 3_000,
      current_amount: 500,
      status: 'active',
      created_at: 1,
      updated_at: 1,
    }
    const now = 2

    const updated = addSavingToChallenge(challenge, 800, now)

    expect(updated.current_amount).toBe(1_300)
    expect(updated.status).toBe('active')
    expect(updated.updated_at).toBe(now)
  })

  test('marks challenge completed when current amount reaches target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Travel',
      target_amount: 3_000,
      current_amount: 2_500,
      status: 'active',
      created_at: 1,
      updated_at: 1,
    }

    const updated = addSavingToChallenge(challenge, 500, 2)

    expect(updated.current_amount).toBe(3_000)
    expect(updated.status).toBe('completed')
  })

  test('keeps completed status when adding beyond target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Travel',
      target_amount: 3_000,
      current_amount: 3_000,
      status: 'completed',
      created_at: 1,
      updated_at: 1,
    }

    const updated = addSavingToChallenge(challenge, 200, 2)

    expect(updated.current_amount).toBe(3_200)
    expect(updated.status).toBe('completed')
  })

  test('keeps paused status when below target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Travel',
      target_amount: 3_000,
      current_amount: 1_000,
      status: 'paused',
      created_at: 1,
      updated_at: 1,
    }

    const updated = addSavingToChallenge(challenge, 500, 2)

    expect(updated.current_amount).toBe(1_500)
    expect(updated.status).toBe('paused')
  })
})

describe('getActiveChallenges', () => {
  test('returns empty array when there are no challenges', () => {
    expect(getActiveChallenges([], [])).toEqual([])
  })

  test('returns progress for an active challenge with no linked savings', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Gadget',
      target_amount: 4_000,
      current_amount: 0,
      status: 'active',
      created_at: 1,
      updated_at: 1,
    }

    const result = getActiveChallenges([challenge], [])

    expect(result).toEqual([
      {
        challenge_id: 'challenge-1',
        name: 'Gadget',
        target_amount: 4_000,
        current_amount: 0,
        percentage: 0,
        status: 'active',
      } satisfies ChallengeProgress,
    ])
  })

  test('aggregates linked savings across multiple records', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Gadget',
      target_amount: 4_000,
      current_amount: 0,
      status: 'active',
      created_at: 1,
      updated_at: 1,
    }
    const savings: SavingRecord[] = [
      makeSaving({ challenge_id: 'challenge-1', amount: 500 }),
      makeSaving({ challenge_id: 'challenge-1', amount: 700 }),
      makeSaving({ challenge_id: 'challenge-2', amount: 9_999 }),
      makeSaving({ challenge_id: undefined, amount: 1_000 }),
    ]

    const result = getActiveChallenges([challenge], savings)[0] as ChallengeProgress

    expect(result.current_amount).toBe(1_200)
    expect(result.percentage).toBe(30)
  })

  test('marks challenge completed when aggregated savings reach target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Gadget',
      target_amount: 2_000,
      current_amount: 0,
      status: 'active',
      created_at: 1,
      updated_at: 1,
    }
    const savings: SavingRecord[] = [
      makeSaving({ challenge_id: 'challenge-1', amount: 1_500 }),
      makeSaving({ challenge_id: 'challenge-1', amount: 500 }),
    ]

    const result = getActiveChallenges([challenge], savings)[0] as ChallengeProgress

    expect(result.current_amount).toBe(2_000)
    expect(result.status).toBe('completed')
    expect(result.percentage).toBe(100)
  })

  test('keeps paused status when aggregated savings are below target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Gadget',
      target_amount: 2_000,
      current_amount: 1_000,
      status: 'paused',
      created_at: 1,
      updated_at: 1,
    }
    const savings: SavingRecord[] = [makeSaving({ challenge_id: 'challenge-1', amount: 200 })]

    const result = getActiveChallenges([challenge], savings)[0] as ChallengeProgress

    expect(result.status).toBe('paused')
  })

  test('caps percentage at 100 when aggregated savings exceed target', () => {
    const challenge: SavingChallenge = {
      challenge_id: 'challenge-1',
      name: 'Gadget',
      target_amount: 1_000,
      current_amount: 0,
      status: 'active',
      created_at: 1,
      updated_at: 1,
    }
    const savings: SavingRecord[] = [makeSaving({ challenge_id: 'challenge-1', amount: 1_500 })]

    const result = getActiveChallenges([challenge], savings)[0] as ChallengeProgress

    expect(result.current_amount).toBe(1_500)
    expect(result.percentage).toBe(100)
  })
})

function makeSaving(partial: Pick<SavingRecord, 'challenge_id' | 'amount'>): SavingRecord {
  return {
    saving_id: 'saving-1',
    amount: partial.amount,
    date: 1,
    description: 'Test saving',
    challenge_id: partial.challenge_id,
  }
}
