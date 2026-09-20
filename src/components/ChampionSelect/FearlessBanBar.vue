<script setup lang="ts">
import { computed } from 'vue'
import type { championSelectTeam, simpleChampionData } from '@bluebottle_gg/league-broadcast-client'
import { useClient } from '@/client'
import { handleImageError, handleImageLoad } from '@/utils/imageUtils'

const props = defineProps<{
  blueTeam: championSelectTeam
  redTeam: championSelectTeam
}>()

const client = useClient()
const cacheUrl = (path?: string) => client.getCacheUrl(path)

// backend keys are 0-based (and possibly sparse); label sequentially by sorted
// key order as G1, G2, G3… regardless of the raw key values.
function toGameList(fb?: { [key: number]: simpleChampionData[] }): simpleChampionData[][] {
  if (!fb) return []
  return Object.keys(fb)
    .map(Number)
    .sort((a, b) => a - b)
    .map((key) => fb[key] ?? [])
    .filter((champs) => champs.length > 0)
}

/**
 * One column per game already played, blue's bans stacked over red's. Grouping
 * by game (rather than by team, as this bar used to) is how a caster reads it:
 * "what was taken in game 2" is the question, not "what has blue taken overall".
 * Stacking also halves the bar's width, so it no longer spans the whole frame.
 */
const gameGroups = computed(() => {
  const blue = toGameList(props.blueTeam.fearlessBans)
  const red = toGameList(props.redTeam.fearlessBans)
  const count = Math.max(blue.length, red.length)
  return Array.from({ length: count }, (_, i) => ({
    game: i + 1,
    blue: blue[i] ?? [],
    red: red[i] ?? [],
  }))
})

const hasData = computed(() => gameGroups.value.length > 0)

// A fearless series reaches at most 4 prior games. Stacked, even four groups
// of five fit the centre column at full size; only beyond that does it tighten.
// Whoever places the bar can override this with a --fear-icon custom property.
const iconSize = computed(() => (gameGroups.value.length <= 4 ? 34 : 28))
</script>

<template>
  <div v-if="hasData" class="fearless-bar" :style="{ '--fear-icon-auto': `${iconSize}px` }">
    <div v-for="(grp, gi) in gameGroups" :key="`g-${grp.game}`" class="game-group">
      <span class="game-label">G{{ grp.game }}</span>
      <div class="game-rows">
        <TransitionGroup name="fear" tag="div" class="icons">
          <div
            v-for="(c, i) in grp.blue"
            :key="`blue-${gi}-${i}`"
            class="fear-icon blue"
            :style="{ '--g': gi, '--c': i }"
          >
            <img
              :src="cacheUrl(c.squareImg)"
              :alt="c.name"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <span class="strike" />
          </div>
        </TransitionGroup>
        <TransitionGroup name="fear" tag="div" class="icons">
          <div
            v-for="(c, i) in grp.red"
            :key="`red-${gi}-${i}`"
            class="fear-icon red"
            :style="{ '--g': gi, '--c': i }"
          >
            <img
              :src="cacheUrl(c.squareImg)"
              :alt="c.name"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <span class="strike" />
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Self-contained block that shrinks to its content, rather than the
   edge-to-edge strip this used to be — whoever places it decides where it
   sits, and it no longer claims the full width of the frame. The bar itself is
   just the row; the surface belongs to each game (see below). */
.fearless-bar {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: var(--fear-gap, 16px);
}

/* One past game: its label beside the two stacked team rows, on a panel of its
   own. Panel-per-game rather than one long bar — the gap between them does the
   dividing, so no hairline is needed and each game reads as a discrete unit. */
.game-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--fear-pad, 8px 12px);
  background: var(--fear-surface, rgb(0 0 0 / 0.82));
  border-radius: var(--radius-lg);
}

.game-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-label {
  font-weight: 800;
  font-size: calc(var(--fear-icon, var(--fear-icon-auto, 34px)) * 0.5);
  letter-spacing: 0.5px;
  color: var(--fear-label, var(--text-secondary));
}

.icons {
  display: flex;
  gap: 4px;
}

.fear-icon {
  position: relative;
  width: var(--fear-icon, var(--fear-icon-auto, 34px));
  height: var(--fear-icon, var(--fear-icon-auto, 34px));
  border-radius: 3px;
  overflow: hidden;
}
.fear-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.5) brightness(0.75);
  display: block;
}
.fear-icon.blue {
  border-bottom: 2px solid var(--blue-team-color);
}
.fear-icon.red {
  border-bottom: 2px solid var(--red-team-color);
}
.strike {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.strike::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -10%;
  width: 120%;
  height: 1.5px;
  transform: rotate(-45deg);
}
.fear-icon.blue .strike::after {
  background: var(--blue-team-color);
  opacity: 0.7;
}
.fear-icon.red .strike::after {
  background: var(--red-team-color);
  opacity: 0.7;
}

/* mid-draft additions (a new game's bans arriving); the initial scene
   build-in stagger is driven by ChampionSelectScene via --g / --c */
.fear-enter-active {
  transition:
    transform 0.4s ease,
    opacity 0.4s ease;
  transition-delay: calc(var(--c, 0) * 0.05s);
}
.fear-enter-from {
  transform: translateY(-16px);
  opacity: 0;
}
</style>
