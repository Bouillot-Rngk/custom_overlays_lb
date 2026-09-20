<script setup lang="ts">
/**
 * The gold column between the two halves of a scoreboard row — a replica of
 * LeagueBroadcast's own `/ingame/v2` `.gold-comparison`.
 *
 * v2 marks the leading side twice: a 2px bottom edge across the whole cell and
 * a small caret at that side's edge pointing in at the number. Both take the
 * leading team's colour. v2 reads that colour from the operator's configured
 * side colours; this overlay uses its own team tokens instead, so the cue
 * matches the rest of the UP & DOWN chrome.
 */
import { computed } from 'vue'

const props = defineProps<{
  orderGold: number
  chaosGold: number
}>()

const diff = computed(() => props.orderGold - props.chaosGold)

const formattedDiff = computed(() => {
  const d = Math.abs(diff.value)
  if (d >= 1000) return (d / 1000).toFixed(1) + 'k'
  return Math.floor(d).toString()
})

/**
 * Below this many gold, v2 calls the row level: the marker still points at the
 * side that is ahead, but it and the cell's edge go neutral grey rather than
 * team colour. v2 reads this from the active style set (`goldComparison.
 * neutralThreshold`), where the operator's current set has it at 400.
 */
const NEUTRAL_THRESHOLD = 400

const leadingTeam = computed(() => {
  if (diff.value > 0) return 'order'
  if (diff.value < 0) return 'chaos'
  return null
})

const leadColor = computed(() => {
  if (Math.abs(diff.value) < NEUTRAL_THRESHOLD) return 'var(--lb-neutral)'
  if (leadingTeam.value === 'order') return 'var(--blue-team-color)'
  if (leadingTeam.value === 'chaos') return 'var(--red-team-color)'
  return 'transparent'
})
</script>

<template>
  <div class="gold-comparison" :style="{ '--lead-color': leadColor }">
    <span v-if="leadingTeam === 'order'" class="lead-marker" />
    <span class="gold-value">{{ formattedDiff }}</span>
    <span v-if="leadingTeam === 'chaos'" class="lead-marker right" />
  </div>
</template>

<style scoped>
.gold-comparison {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--lb-surface-base);
  border-bottom: 2px solid var(--lead-color);
  overflow: hidden;
}

.gold-value {
  font-family: var(--lb-font-global);
  font-size: 13.12px;
  line-height: 1;
  font-weight: 800;
  text-align: center;
  color: var(--lb-text-primary);
}

/* Zero-size box whose one coloured border collapses into a triangle. Both
   sides point inward at the figure, as they do in v2. */
.lead-marker {
  position: absolute;
  top: 40%;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.lead-marker:not(.right) {
  left: 0;
  border-left: 4px solid var(--lead-color);
}

.lead-marker.right {
  right: 0;
  border-right: 4px solid var(--lead-color);
}
</style>
