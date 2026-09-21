<script setup lang="ts">
/**
 * A team's column of five player tabs, pinned to its side of the screen.
 *
 * Gated on the `tabs` record alone. The operator can hide the tabs and the
 * bottom row independently, and hiding one makes the backend stop sending that
 * record — so gating this column on `scoreboardBottom` (as it used to) meant
 * switching the bottom row off took the tabs down with it. The bottom row's
 * record is still read where it has something the tabs want, but it is never
 * required.
 */
import { computed } from 'vue'
import { Team } from '@bluebottle_gg/league-broadcast-client'
import { useIngameSelector, useIsInGame } from '@/composables/useIngame'
import FadeTransition from '../../transitions/FadeTransition.vue'
import PlayerTab from './PlayerTab.vue'

const props = defineProps<{
  team: Team
  /** Red side: pin to the right edge and mirror each tab. */
  mirror?: boolean
}>()

const isInGame = useIsInGame()
const scoreboard = useIngameSelector((s) => s.gameData.scoreboardBottom)
const tabs = useIngameSelector((s) => s.gameData.tabs)

const teamIndex = computed(() => (props.team === Team.Order ? 0 : 1))
const tabsKey = computed(() => (props.team === Team.Order ? 'Order' : 'Chaos'))

const players = computed(() => scoreboard.value?.teams[teamIndex.value]?.players ?? [])
const tabPlayers = computed(() => tabs.value?.[tabsKey.value]?.players ?? [])
</script>

<template>
  <FadeTransition>
    <!-- The v2 tile carries no team accent of its own — side is read from the
         column's screen edge — so no team colour is passed down. -->
    <div v-if="isInGame && tabPlayers.length" class="player-tabs" :class="{ mirror }">
      <PlayerTab
        v-for="i in 5"
        :key="i"
        :scoreboard-player="players[i - 1]"
        :tab-player="tabPlayers[i - 1]"
        :mirror="mirror"
      />
    </div>
  </FadeTransition>
</template>

<style scoped>
.player-tabs {
  display: flex;
  flex-direction: column;
  /* 5 shells of 86px (12 name + 2 gap + 72 tile) plus four 8px gaps = the
     462px column /ingame/v2 renders, before --tab-scale (see overlay-layout.css). */
  gap: calc(8px * var(--tab-scale, 1));
}
</style>
