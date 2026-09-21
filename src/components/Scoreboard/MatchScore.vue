<script setup lang="ts">
/**
 * Series score beside each team crest — a replica of `/ingame/v2`'s
 * `.booleanIndicator`: one bar per game needed to win the series, stacked.
 */
import { computed } from 'vue'
import { BestOfType } from '@bluebottle_gg/league-broadcast-client'

const props = defineProps<{
  bestOf: BestOfType
  wins: number
  mirror?: boolean
}>()

/** Bars = games needed to win the series (majority), not games played. */
const barCount = computed(() => Math.max(1, Math.ceil(Number(props.bestOf) / 2)))
</script>

<template>
  <div v-if="bestOf !== BestOfType.BestOf1" class="boolean-indicator">
    <span
      v-for="i in barCount"
      :key="i"
      class="indicator-bar"
      :class="i <= wins ? 'won' : 'pending'"
    />
  </div>
</template>

<style scoped>
.boolean-indicator {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 4px;
  height: 100%;
}

.indicator-bar {
  width: 16px;
  flex: 1 1 0;
}

/* Flipped relative to v2. The operator's style set paints WON games neutral
   grey and games still to play in the team colour, which reads backwards; with
   every figure on the bar now white the series is also one of the few places
   the side colour still speaks, so a win is the filled, coloured state. */
.indicator-bar.won {
  background: var(--side-color);
}

.indicator-bar.pending {
  background: rgb(255 255 255 / 0.16);
}
</style>
