import { PrizePool, PrizeOption } from 'schemas'

export function get_next_prize(prize_pool: PrizePool): PrizeOption | undefined {
  const { prizes, claimed } = prize_pool

  let total = 0
  for (let i = 0; i < prizes.length; i += 1) {
    const { available, ...prize_info } = prizes[i]
    total += available

    if (claimed < total) return prize_info
  }

  return undefined
}
