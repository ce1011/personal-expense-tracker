import type { SavingChallenge, SavingRecord } from '@/types/app-data'

export interface ChallengeProgress {
  challenge_id: string
  name: string
  target_amount: number
  current_amount: number
  percentage: number
  status: 'active' | 'completed' | 'paused'
}

export function createChallenge(
  name: string,
  target_amount: number,
  now = Date.now(),
): SavingChallenge {
  return {
    challenge_id: makeId('challenge'),
    name: name.trim(),
    target_amount,
    current_amount: 0,
    status: 'active',
    created_at: now,
    updated_at: now,
  }
}

export function addSavingToChallenge(
  challenge: SavingChallenge,
  amount: number,
  now = Date.now(),
): SavingChallenge {
  const current_amount = challenge.current_amount + amount
  const status = current_amount >= challenge.target_amount ? 'completed' : challenge.status

  return {
    ...challenge,
    current_amount,
    status,
    updated_at: now,
  }
}

export function getActiveChallenges(
  challenges: SavingChallenge[],
  savings: SavingRecord[],
): ChallengeProgress[] {
  return challenges.map((challenge) => {
    const current_amount = savings
      .filter((saving) => saving.challenge_id === challenge.challenge_id)
      .reduce((sum, saving) => sum + saving.amount, 0)
    const target_amount = challenge.target_amount
    const percentage = target_amount > 0 ? Math.min(100, (current_amount / target_amount) * 100) : 0
    const status = current_amount >= target_amount ? 'completed' : challenge.status

    return {
      challenge_id: challenge.challenge_id,
      name: challenge.name,
      target_amount,
      current_amount,
      percentage,
      status,
    }
  })
}

function makeId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}
