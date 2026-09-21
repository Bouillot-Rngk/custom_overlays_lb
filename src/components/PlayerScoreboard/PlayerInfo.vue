<script setup lang="ts">
/**
 * One side of one scoreboard row — a replica of LeagueBroadcast's own
 * `/ingame/v2` `.player` block:
 *
 *     [ inventory (1fr) | CS over KDA (51.19px) | champion portrait (49.59px) ]
 *
 * mirrored for the red side so both sides' portraits meet the gold column.
 *
 * v2 carries no summoner name, no summoner spells and no level here — that is
 * its deliberate split, with live state living in the side champion tabs. The
 * derivations this view still needs are shared via usePlayerVitals.
 */
import type {
  ingameScoreboardBottomPlayerData,
  tabPlayer,
} from '@bluebottle_gg/league-broadcast-client'
import { toRef } from 'vue'
import PlayerItems from './PlayerItems.vue'
import { useClient } from '@/client'
import LevelUpNotification from './LevelUpNotification.vue'
import { usePlayerVitals } from '@/composables/usePlayerVitals'

const props = defineProps<{
  scoreboardPlayer?: ingameScoreboardBottomPlayerData
  tabPlayer?: tabPlayer
  mirror?: boolean
  levelUpLevel?: number | null
  levelUpVisible?: boolean
  levelUpExiting?: boolean
}>()

const client = useClient()

const { shutdown, respawnTimeRemaining, isDead } = usePlayerVitals(
  toRef(props, 'scoreboardPlayer'),
  toRef(props, 'tabPlayer'),
)
</script>

<template>
  <div class="player" :class="{ mirror }">
    <PlayerItems
      class="player-inventory"
      :scoreboard-player="scoreboardPlayer"
      :tab-player="tabPlayer"
      :mirror="mirror"
    />

    <div class="player-stats">
      <span class="creep-score">{{ scoreboardPlayer?.creepScore }}</span>
      <span class="kda"
        >{{ scoreboardPlayer?.kills }}/{{ scoreboardPlayer?.deaths }}/{{
          scoreboardPlayer?.assists
        }}</span
      >
    </div>

    <div class="champion-cell">
      <img
        class="champion-image"
        :class="{ dead: isDead }"
        :src="client.getCacheUrl(scoreboardPlayer?.champion?.squareImg)"
      />
      <span v-if="shutdown" class="shutdown">{{ shutdown }}</span>
      <span v-if="isDead" class="respawn">{{ respawnTimeRemaining }}</span>
      <LevelUpNotification
        :level="levelUpLevel ?? undefined"
        :visible="levelUpVisible ?? false"
        :exiting="levelUpExiting ?? false"
        :mirror="mirror"
      />
    </div>
  </div>
</template>

<style scoped>
/* Track widths are v2's own (3.2rem / 3.1rem against a 16px root), written
   out in px so an OBS source cannot resize them via root font-size. */
.player {
  display: grid;
  /* Stats track widened from v2's 51.19: the brand face is monospaced, so a
     late-game KDA is far wider than the proportional face v2 sets it in and
     was being clipped by this block's overflow. 64px clears the worst case
     ("10/10/20"); the inventory track pays for it, and its own end padding was
     trimmed to keep all eight slots fitting. */
  grid-template-columns: minmax(0, 1fr) 64px 49.59px;
  align-items: stretch;
  column-gap: 2px;
  background: var(--lb-surface-base);
  overflow: hidden;
}

.player.mirror {
  grid-template-columns: 49.59px 64px minmax(0, 1fr);
}

/* Source order is inventory, stats, portrait; the red side re-orders so the
   portrait sits innermost against the gold column on both sides.

   The row index is pinned as well as the column: with only a column given,
   auto-placement refuses to move the cursor backwards and drops each later
   child onto a new row, which silently makes the block three rows tall. */
.player.mirror .player-inventory {
  grid-area: 1 / 3;
}

.player.mirror .player-stats {
  grid-area: 1 / 2;
}

.player.mirror .champion-cell {
  grid-area: 1 / 1;
}

.player-stats {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* No gap between the two: v2 stacks them on touching line boxes. */
.creep-score {
  font-family: var(--brand-font-body);
  font-size: 11.84px;
  line-height: 1;
  font-weight: 700;
  text-align: center;
  color: var(--lb-text-secondary);
}

.kda {
  font-family: var(--brand-font-body);
  /* 13px, not v2's 16: at the mono face's 0.61em advance that keeps a
     seven-character KDA inside the track, and still reads above the CS line. */
  font-size: 13px;
  line-height: 1;
  font-weight: 500;
  text-align: center;
  color: var(--lb-text-primary);
}

.champion-cell {
  position: relative;
  height: 100%;
  background: var(--lb-surface-raised);
  overflow: hidden;
}

/* Hairline ring drawn inside the cell rather than as a border, so it does not
   eat into the portrait's 49.59px. */
.champion-cell::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 1px var(--lb-border-subtle);
  pointer-events: none;
}

.champion-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.champion-image.dead {
  filter: var(--lb-portrait-dead);
  transition: filter 0.5s ease;
}

/* Bounty strip across the top of the portrait. */
.shutdown {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 9.6px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2.4px;
  font-family: var(--brand-font-body);
  font-size: 9.6px;
  line-height: 1;
  font-weight: 750;
  color: var(--lb-highlight);
  text-shadow: var(--lb-text-bloom);
}

.respawn {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  font-family: var(--brand-font-body);
  font-size: 16.8px;
  line-height: 1;
  font-weight: 800;
  text-align: center;
  color: var(--lb-negative);
}
</style>
