<script setup lang="ts">
/**
 * One player's inventory strip — a replica of LeagueBroadcast's own
 * `/ingame/v2` `.inventory`.
 *
 * v2 paints exactly eight tiles, in this order from the screen edge inward:
 *
 *     [ trinket | item x6, cheapest first | role quest ]
 *
 * That mapping was verified by matching the rendered asset hashes on
 * `/ingame/v2` against the backend feed's own `slot` numbers: the trinket is
 * item slot 6, the role quest is slot 8, and item slot 7 is deliberately not
 * shown. Empty tiles are still painted so the strip keeps a fixed footprint
 * and items do not shuffle sideways as they are bought.
 */
import {
  getRoleQuest,
  getSortedInventory,
  getTrinket,
  isPlayerDead,
  type ingameScoreboardBottomPlayerData,
  type tabPlayer,
} from '@bluebottle_gg/league-broadcast-client'
import { computed } from 'vue'
import ItemWithCooldown from './ItemWithCooldown.vue'
import { useGameClock } from '@/composables/useGameClock'

const props = defineProps<{
  scoreboardPlayer?: ingameScoreboardBottomPlayerData
  tabPlayer?: tabPlayer
  mirror?: boolean
}>()

const gameClock = useGameClock()

// Derived here rather than passed down, so the scoreboard root does not have to read the
// clock — and rebuild every player's vnodes — on every animation frame.
const grayscale = computed(() => isPlayerDead(props.scoreboardPlayer, gameClock.value))

const trinket = computed(() =>
  props.scoreboardPlayer ? getTrinket(props.scoreboardPlayer) : undefined,
)

const roleQuest = computed(() =>
  props.scoreboardPlayer ? getRoleQuest(props.scoreboardPlayer) : undefined,
)

/** Six tiles, cheapest first; the helper pads the front with empties. */
const sortedInventory = computed(() =>
  props.scoreboardPlayer ? getSortedInventory(props.scoreboardPlayer) : [],
)
</script>

<template>
  <div class="inventory" :class="{ mirror, 'is-dead': grayscale }">
    <ItemWithCooldown :item="trinket" :vision-score="scoreboardPlayer?.visionScore" />
    <ItemWithCooldown v-for="(item, index) in sortedInventory" :key="index" :item="item" />
    <ItemWithCooldown :item="roleQuest" />
  </div>
</template>

<style scoped>
/* Read off the live /ingame/v2 DOM: 2.304px between tiles, 6.4px of end
   padding, packed toward the champion portrait so the strip grows outward. */
.inventory {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 2.304px;
  /* 4px rather than v2's 6.4: the stats track next door needs the width for a
     monospaced KDA, and this is the only slack in the row. */
  padding: 0 4px;
  height: 100%;
  min-width: 0;
}

.inventory.mirror {
  flex-direction: row-reverse;
}

/* Dead players' items grey out together with their portrait. */
.inventory.is-dead {
  filter: grayscale(1);
  transition: filter 0.5s ease;
}
</style>
