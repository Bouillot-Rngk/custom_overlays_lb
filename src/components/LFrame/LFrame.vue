<script setup lang="ts">
import { computed } from 'vue'
import { useIsInGame } from '@/composables/useIngame'
import GameInfo from './GameInfo.vue'
import SponsorRotation from './SponsorRotation.vue'
import ChampionDetailPanel from '../ChampionDetailPanel/ChampionDetailPanel.vue'
import InhibitorTimers from '../InhibitorTimers/InhibitorTimers.vue'
import FadeTransition from '../../transitions/FadeTransition.vue'
import { useIngameSelector } from '@/composables/useIngame'
import { useGameClock } from '@/composables/useGameClock'

const isInGame = useIsInGame()
const inhibitors = useIngameSelector((s) => s.gameData.inhibitors ?? [])
const gameTime = useGameClock()

const showInhibitorTimers = computed(() =>
  inhibitors.value.some((team) =>
    Object.values(team.inhibitors ?? {}).some(
      (inhibitor) => (inhibitor.timeAlive ?? 0) > gameTime.value,
    ),
  ),
)
</script>

<template>
  <FadeTransition>
    <div v-if="isInGame" class="lframe-container">
      <div class="lframe-header">
        <GameInfo />
      </div>
      <div id="champion-info-cutout">
        <InhibitorTimers v-if="showInhibitorTimers" class="inhibitor-detail" />
        <ChampionDetailPanel v-else class="champion-detail" />
      </div>
      <div class="lframe-footer">
        <SponsorRotation />
      </div>
    </div>
  </FadeTransition>
</template>

<style lang="css" scoped>
.lframe-container {
  display: grid;
  /* Header/footer trimmed by 4px/10px vs. the previous 38/114 to hand the champion-detail
     panel more vertical room top and bottom. GameInfo and SponsorRotation drop their internal
     vertical padding by the same amounts so the patch bar and sponsor logos render unchanged. */
  grid-template-rows: 34px 1fr 104px;
  grid-template-columns: 1fr;
  /* The panel is flush to the left, top and bottom of the frame, so its inner
     edge is the only one that meets the game feed and the only one that needs
     a rule to terminate against it. */
  border-right: var(--brand-border-width) solid var(--line-soft);
  z-index: 100;
}

/* The three bands are all black, so hairlines are what separate them. Without
   these the panel reads as one undifferentiated slab. */
.lframe-header {
  background-color: var(--ink-950);
  border-bottom: var(--brand-border-width) solid var(--line-soft);
}

/* Sponsor band. Deliberately the same black as the rest of the panel — the
   hairline above it is the only separation it needs. */
.lframe-footer {
  background-color: var(--ink-950);
  border-top: var(--brand-border-width) solid var(--line-soft);
}

#champion-info-cutout {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background-color: var(--ink-950);
}

/* Champion detail fills the black window; we render the panel ourselves now,
   so there's no cutout frame overlaid on top. */
.champion-detail {
  position: absolute;
  inset: 0;
}

.inhibitor-detail {
  position: absolute;
  inset: 0;
}
</style>
