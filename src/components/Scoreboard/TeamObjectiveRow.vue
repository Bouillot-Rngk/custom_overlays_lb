<script setup lang="ts">
/**
 * One team's half of the scoreboard's objective band — a replica of
 * `/ingame/v2`'s `bottomContent-leftTeam` / `-rightTeam`:
 *
 *   [ dragons | plates | grubs ]  (game clock)  [ grubs | plates | dragons ]
 *
 * Counts sit outboard of their own icon on each side, so both halves read
 * outward from the clock.
 */
import { type ingameScoreboardTeamData } from '@bluebottle_gg/league-broadcast-client'
import Grubs from '@/assets/grubs.png'
import TowerPlate from '@/assets/towerPlate.png'
import Fire from '@/assets/dragon/fire.png'
import Air from '@/assets/dragon/air.png'
import Chemtech from '@/assets/dragon/chemtech.png'
import Hextech from '@/assets/dragon/hextech.png'
import Earth from '@/assets/dragon/earth.png'
import Water from '@/assets/dragon/water.png'
import Elder from '@/assets/dragon/elder.png'
import { handleImageError, handleImageLoad } from '@/utils/imageUtils'
import { computed } from 'vue'

const props = defineProps<{
  team: ingameScoreboardTeamData
  mirror?: boolean
}>()

const DRAGON_ICONS: Record<string, string> = {
  fire: Fire,
  air: Air,
  chemtech: Chemtech,
  hextech: Hextech,
  earth: Earth,
  water: Water,
  elder: Elder,
}

const dragons = computed(() =>
  (props.team.dragons ?? [])
    .map((d) => DRAGON_ICONS[String(d).toLowerCase()])
    .filter((icon): icon is string => Boolean(icon)),
)
</script>

<template>
  <div class="objective-row" :class="{ mirror }">
    <img
      class="objective-icon"
      :src="Grubs"
      alt=""
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <p class="objective-text">{{ team.grubs }}</p>

    <img
      class="objective-icon plate-icon"
      :src="TowerPlate"
      alt=""
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <p class="objective-text">{{ team.towerPlates }}</p>

    <img
      v-for="(icon, i) in dragons"
      :key="i"
      class="objective-icon dragon-icon"
      :src="icon"
      alt=""
      @error="handleImageError"
      @load="handleImageLoad"
    />
  </div>
</template>

<style scoped>
/* Blue reads right-to-left off the clock, red left-to-right. */
.objective-row {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 4px;
  height: 32px;
  margin-right: 16px;
  /* Both halves take the same width, so the clock stays on the band's midline
     however many dragons one side has taken. */
  width: 100%;
}

.objective-row.mirror {
  flex-direction: row;
  margin-right: 0;
  margin-left: 16px;
}

/* Height-driven so each mark keeps its own aspect ratio — the plate art is
   noticeably taller than it is wide. */
.objective-icon {
  width: auto;
  height: 100%;
  object-fit: cover;
  flex: 0 0 auto;
}

.dragon-icon {
  object-fit: contain;
}

.objective-text {
  margin: 0;
  font-family: var(--brand-font-body);
  font-size: 16px;
  line-height: normal;
  font-weight: 400;
  color: var(--sb-text, #fff);
  text-align: center;
}
</style>
