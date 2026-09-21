<script setup lang="ts">
/**
 * One team's role-quest badges: a lane mark per player, lit once that player
 * has finished their support/jungle quest item.
 *
 * The whole strip hides once a side has completed all five — it is a progress
 * cue for the early game, not a permanent fixture.
 *
 * Reads the bottom-scoreboard record, which is where the quest item lives. It
 * is gated on that record being present rather than the scoreboard being gated
 * on it, so hiding the bottom row costs these badges and nothing else.
 */
import { computed } from 'vue'
import {
  getRoleQuest,
  type ingameScoreboardBottomPlayerData,
} from '@bluebottle_gg/league-broadcast-client'
import TopIcon from '@/assets/lane/top-placeholder-cropped.svg'
import JungleIcon from '@/assets/lane/jgl-placeholder-cropped.svg'
import MidIcon from '@/assets/lane/mid-placeholder-cropped.svg'
import BotIcon from '@/assets/lane/bot-placeholder-cropped.svg'
import SupportIcon from '@/assets/lane/sup-placeholder-cropped.svg'

const props = defineProps<{
  players: ingameScoreboardBottomPlayerData[]
  mirror?: boolean
  /** Mock feed carries no real quest items, so completion is faked from respawnAt. */
  isMocking?: boolean
}>()

const ROLE_ICONS = [TopIcon, JungleIcon, MidIcon, BotIcon, SupportIcon]

/** Support and jungle quest items only — everything else has no quest to track. */
function isQuestItem(item: { id: number }) {
  if (!item) return false
  if (item.id >= 1090 && item.id <= 1095) return true
  if (item.id >= 1200 && item.id <= 1250) return true
  return false
}

function playerHasQuestComplete(player: ingameScoreboardBottomPlayerData) {
  if (props.isMocking) return Boolean(player.respawnAt)

  const roleItem = getRoleQuest(player)
  // A player with no quest item has nothing outstanding.
  if (!roleItem || !isQuestItem(roleItem)) return true
  if (!roleItem.stats || roleItem.stats.length < 2) return false
  // These two ids are the already-upgraded forms.
  if (roleItem.id === 1220 || roleItem.id === 1206) return true
  const current = roleItem.stats[0] ?? 0
  const max = roleItem.stats[1] ?? 1
  return current >= max
}

const teamColor = computed(() =>
  props.mirror ? 'var(--red-team-color)' : 'var(--blue-team-color)',
)

const visible = computed(
  () => props.players.length > 0 && !props.players.every(playerHasQuestComplete),
)

function badgeStyle(player: ingameScoreboardBottomPlayerData, index: number) {
  const done = playerHasQuestComplete(player)
  return {
    borderColor: done ? teamColor.value : 'rgb(255 255 255 / 0.33)',
    backgroundColor: done
      ? `color-mix(in srgb, ${teamColor.value} 14%, transparent)`
      : 'rgb(0 0 0 / 0.4)',
    color: done ? teamColor.value : '#ffffff',
    '--i': props.mirror ? props.players.length - 1 - index : index,
  }
}
</script>

<template>
  <TransitionGroup
    v-if="visible"
    name="stagger-fade"
    tag="div"
    appear
    class="quest-row"
    :class="{ mirror }"
  >
    <div v-for="(player, i) in players" :key="i" class="quest-badge" :style="badgeStyle(player, i)">
      <component :is="ROLE_ICONS[i]" class="quest-icon" />
    </div>
  </TransitionGroup>
</template>

<style scoped>
/* Same panel as the objective band beside it — gradient, hairline, radius and
   drop shadow — so the two read as one row of furniture. It only exists while
   a side still has a quest outstanding, since the row itself is conditional. */
.quest-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  height: 27px;
  padding: 0 6px;
  background: linear-gradient(180deg, var(--lb-surface-glass) 0%, var(--lb-surface-scrim) 100%);
  border: 1px solid var(--lb-border-subtle);
  border-radius: var(--lb-radius-tile);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.44);
}

/* Red reads inward from its own edge, so its lanes run in the same order
   outward-in as blue's. */
.quest-row.mirror {
  flex-direction: row-reverse;
}

.quest-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 5% up from 22/13. */
  width: 23.1px;
  height: 23.1px;
  border: 1px solid;
  border-radius: 50%;
  flex: 0 0 auto;
}

/* The mark inherits the badge's colour, so lit and unlit need no second rule. */
.quest-icon {
  width: 13.65px;
  height: 13.65px;
  fill: currentColor;
}

.stagger-fade-enter-active,
.stagger-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.stagger-fade-enter-active {
  transition-delay: calc(700ms + var(--i) * 120ms);
}

.stagger-fade-enter-from,
.stagger-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
