<script setup lang="ts">
// Free-tier overlay: only the components LeagueBroadcast's free tier feeds with
// data (Scoreboard, Player Tabs, Player Scoreboard, Objective Timers, Minimap
// Frame). The L-Frame — the bottom-left panel carrying the rotating
// event/match/patch bar, the champion-detail cutout and the sponsor band — was
// dropped at the user's request; it is still mounted on its own preview page at
// /ingame/element/lframe, so restoring it here is an import plus a tag.
// The side Player Tabs carry each player's live state — name,
// level, spells, ultimate and vitals — which the bottom scoreboard used to
// squeeze in alongside items and KDA. The Basic-tier components (gold graph, kill feed, skin /
// rune display, smite reaction, teamfights, player cameras, announcer,
// power play, side info) are kept in the repo under src/components/ — restore
// their import + tag here after upgrading the tier.
import { Team } from '@bluebottle_gg/league-broadcast-client'
import Scoreboard from '@/components/Scoreboard/Scoreboard.vue'
import PlayerTabs from '@/components/PlayerTabs/PlayerTabs.vue'
import PlayerScoreboard from '@/components/PlayerScoreboard/PlayerScoreboard.vue'
import ObjectiveTimers from '@/components/ObjectiveTimer/ObjectiveTimers.vue'
import MinimapFrame from '@/components/Minimap/MinimapFrame.vue'
import DebugBackground from '@/components/Debug/DebugBackground.vue'

withDefaults(
  defineProps<{
    /** The combined scene owns its background below every phase layer. */
    showDebugBackground?: boolean
  }>(),
  { showDebugBackground: true },
)

// Individual elements have their own pages under /ingame/element/<name> (index: /ingame/elements).
</script>

<template>
  <div class="overlay">
    <DebugBackground v-if="showDebugBackground" />
    <Scoreboard class="overlay-scoreboard" />
    <PlayerTabs class="overlay-player-tabs overlay-player-tabs-blue" :team="Team.Order" />
    <PlayerTabs class="overlay-player-tabs overlay-player-tabs-red" :team="Team.Chaos" mirror />
    <PlayerScoreboard class="overlay-playerscoreboard" />
    <ObjectiveTimers class="overlay-objective-timers" />
    <MinimapFrame class="overlay-minimap" />
  </div>
</template>
