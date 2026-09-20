import { computed, type Ref } from 'vue'
import {
  ResourceType,
  SpellSlotIndex,
  getRespawnRemaining,
  isPlayerDead,
  type ingameScoreboardBottomPlayerData,
  type tabPlayer,
} from '@bluebottle_gg/league-broadcast-client'
import { useGameClock } from '@/composables/useGameClock'
import { playerDisplayName } from '@/utils/playerDisplayName'
import { xpProgressPct } from '@/utils/xpProgress'

/**
 * Per-player derived state shared by the two places a player is drawn: the
 * side tabs (name, level, spells, ultimate, vitals) and the bottom scoreboard
 * row (name, level, items, KDA). Both read the same two backend records, so
 * keeping the derivations here stops the two views drifting apart — a
 * resource-colour or respawn rule fixed in one used to miss the other.
 */
export function usePlayerVitals(
  scoreboardPlayer: Ref<ingameScoreboardBottomPlayerData | undefined>,
  tabPlayer: Ref<tabPlayer | undefined>,
) {
  const gameTime = useGameClock()

  /**
   * Bounty on the player's head, gold-suffixed.
   *
   * /ingame/v2 prints every non-zero bounty rather than waiting for one worth
   * calling out — it shows values as low as 76g — so there is no threshold
   * here either. Compact notation only kicks in in the thousands.
   */
  const shutdown = computed(() => {
    const p = scoreboardPlayer.value
    if (!p) return undefined
    if (!p.shutdown || p.shutdown <= 0) return ''
    const value = p.shutdown.toLocaleString('en-US', {
      notation: 'compact',
      maximumFractionDigits: 0,
    })
    return `${value}g`
  })

  const respawnTimeRemaining = computed(() => {
    const p = scoreboardPlayer.value
    if (!p) return undefined
    const remaining = getRespawnRemaining(p, gameTime.value)
    return remaining > 0 ? Math.ceil(remaining) : undefined
  })

  const isDead = computed(() => isPlayerDead(scoreboardPlayer.value, gameTime.value))

  const ultimate = computed(() =>
    scoreboardPlayer.value ? tabPlayer.value?.abilities[SpellSlotIndex.R] : undefined,
  )
  const summonerOne = computed(() => tabPlayer.value?.abilities[SpellSlotIndex.D])
  const summonerTwo = computed(() => tabPlayer.value?.abilities[SpellSlotIndex.F])

  // Champion alias is the last resort, so a name plate never renders empty for a
  // player the backend gave neither an overlay name nor a Riot ID.
  const playerName = computed(() =>
    playerDisplayName(scoreboardPlayer.value, scoreboardPlayer.value?.champion?.alias ?? ''),
  )

  const buffBorderClass = computed(() => {
    const hasBaron = tabPlayer.value?.hasBaron ?? false
    const hasElder = tabPlayer.value?.hasElder ?? false
    if (hasBaron && hasElder) return 'buff-both'
    if (hasBaron) return 'buff-baron'
    if (hasElder) return 'buff-elder'
    return ''
  })

  const xpProgress = computed(() => xpProgressPct(tabPlayer.value?.experience))

  /**
   * A resourceless champion reports `max: 0`, which is not nullish — so `?? 1`
   * does not catch it and the division yields NaN. Feeding that straight into
   * `width: NaN%` is invalid CSS, and the bar falls back to its auto width:
   * a resourceless champion rendered a *full* resource bar. Clamp here, where
   * both the tabs and anything else reading these values are covered.
   */
  const pct = (current?: number, max?: number) => {
    const value = ((current ?? 0) / (max || 1)) * 100
    if (!Number.isFinite(value)) return 0
    return Math.min(100, Math.max(0, value))
  }

  const healthPct = computed(() =>
    pct(tabPlayer.value?.health.current, tabPlayer.value?.health.max),
  )
  const resourcePct = computed(() =>
    pct(tabPlayer.value?.resource.current, tabPlayer.value?.resource.max),
  )

  const resourceColor = computed(() => {
    // resource type might arrive as a string, so parse it to the enum if needed
    const raw = tabPlayer.value?.resource.type
    const resourceType =
      typeof raw === 'string' ? ResourceType[raw as keyof typeof ResourceType] : raw

    switch (resourceType) {
      case ResourceType.mana:
        return '#1d4ed8'
      case ResourceType.energy:
        return '#d6db29'
      case ResourceType.none:
        return 'transparent'
      case ResourceType.shield:
        return '#A9A9A9'
      case ResourceType.battlefury:
      case ResourceType.dragonfury:
      case ResourceType.rage:
      case ResourceType.heat:
      case ResourceType.gnarfury:
      case ResourceType.ferocity:
      case ResourceType.bloodwell:
        return '#bf0000'
      case ResourceType.wind:
        return '#A9A9A9'
      case ResourceType.unknown:
      default:
        return '#1d4ed8'
    }
  })

  return {
    gameTime,
    shutdown,
    respawnTimeRemaining,
    isDead,
    ultimate,
    summonerOne,
    summonerTwo,
    playerName,
    buffBorderClass,
    xpProgress,
    healthPct,
    resourcePct,
    resourceColor,
  }
}
