<script setup lang="ts">
/**
 * Top scoreboard — a replica of LeagueBroadcast's own `/ingame/v2`
 * `.globalScoreboard`. Geometry, colours and type were read off that overlay's
 * live DOM rather than eyeballed.
 *
 * Two stacked bands, 2px apart, the whole assembly centred on the frame and
 * sized to its own content:
 *
 *   topContent     [ team block ] [ 64px centre ] [ team block ]
 *   bottomContent  [ objectives | game clock | objectives ]
 *
 * The centre track is v2's tournament-icon slot. It is kept as a correctly
 * sized empty box so a tournament/season mark can be dropped in without
 * moving anything either side of it.
 */
import { computed } from 'vue'
import { useIngameSelector } from '@/composables/useIngame'
import TeamRow from './TeamRow.vue'
import TeamObjectiveRow from './TeamObjectiveRow.vue'
import DragonBuffBanner from './DragonBuffBanner.vue'

const scoreboard = useIngameSelector((s) => s.gameData.scoreboard)

const blue = computed(() => scoreboard.value?.teams[0])
const red = computed(() => scoreboard.value?.teams[1])

const gameTime = computed(() => {
  if (!scoreboard.value) return '00:00'
  const minutes = Math.floor(scoreboard.value.gameTime / 60)
  const seconds = Math.floor(scoreboard.value.gameTime % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})
</script>

<template>
  <Transition name="scoreboard" :duration="{ enter: 850, leave: 750 }">
    <div v-if="scoreboard && blue && red" class="global-scoreboard">
      <div class="row-clip">
        <div class="top-content">
          <TeamRow
            class="team-block team-block-left"
            :team="blue"
            :best-of="scoreboard.bestOf"
            :enemy-team-gold="red.gold"
          />
          <!-- v2's tournament-icon slot; empty until a mark is configured. -->
          <div class="tournament-icon" />
          <TeamRow
            class="team-block team-block-right"
            :team="red"
            :best-of="scoreboard.bestOf"
            :enemy-team-gold="blue.gold"
            mirror
          />
        </div>
      </div>

      <div class="row-clip">
        <div class="bottom-content">
          <TeamObjectiveRow :team="blue" />
          <div class="game-timer">
            <p class="game-timer-text">{{ gameTime }}</p>
          </div>
          <TeamObjectiveRow :team="red" mirror />
        </div>
      </div>

      <DragonBuffBanner class="dragon-banner" />
    </div>
  </Transition>
</template>

<style scoped>
.global-scoreboard {
  /* Every figure on the bar is white; team identity is carried by the flank
     edges, the series bars and the advantage chips instead. One knob, so the
     whole bar moves together. */
  --sb-text: #fff;

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: fit-content;
  background: transparent;
}

/* Hung below the two bands rather than stacked as a third flex child: its
   wrapper is always in the DOM even when no soul is active, so in the column
   it would spend the whole game contributing an extra 2px gap and push the
   assembly off v2's 98px. */
.dragon-banner {
  position: absolute;
  top: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
}

/* The clip exists only so the rows can slide in from behind the frame edge.
   Left on permanently it would also crop the bands' drop shadows, so it is
   applied for the duration of the transition and not otherwise. */
.scoreboard-enter-active .row-clip,
.scoreboard-leave-active .row-clip {
  overflow: hidden;
}

/* Enter: top row first, bottom row waits for top to finish */
.scoreboard-enter-active .top-content {
  animation: row-slide-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.scoreboard-enter-active .bottom-content {
  animation: row-slide-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both;
}

/* Exit: bottom row first, top row waits for bottom to finish */
.scoreboard-leave-active .top-content {
  animation: row-slide-out 0.35s cubic-bezier(0.55, 0, 0.75, 0.06) 0.35s both;
}

.scoreboard-leave-active .bottom-content {
  animation: row-slide-out 0.35s cubic-bezier(0.55, 0, 0.75, 0.06) both;
}

@keyframes row-slide-in {
  from {
    transform: translateY(-100%);
  }

  to {
    transform: translateY(0);
  }
}

@keyframes row-slide-out {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-100%);
  }
}

/* Equal flanking tracks either side of a fixed centre. Because the tracks are
   `1fr` inside a content-sized box they both take the width of the WIDER team
   block, which is what keeps the 64px centre slot on the frame's midline even
   when one side's name or gold figure runs longer. */
.top-content {
  display: grid;
  grid-template-columns: 1fr 64px 1fr;
  grid-template-rows: 64px;
  align-items: start;
}

/* Each block is pushed against the centre slot, so the two always meet it no
   matter how much slack its track has. */
.team-block-left {
  justify-self: end;
}

.team-block-right {
  justify-self: start;
}

.tournament-icon {
  height: 100%;
  background: var(--lb-surface-base);
  border-radius: var(--lb-radius-tile);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.44);
}

.bottom-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 32px;
  /* v2 grades this band darker than the team blocks above it, so it reads as
     a subtitle to the bar rather than a second panel of equal weight. */
  background: linear-gradient(180deg, var(--lb-surface-glass) 0%, var(--lb-surface-scrim) 100%);
  border: 1px solid var(--lb-border-subtle);
  border-radius: var(--lb-radius-tile);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.44);
}

.game-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 100%;
}

/* The clock is this scene's one hero number, so it takes the feature face —
   the same role the countdown plays on the draft bar. */
.game-timer-text {
  margin: 0;
  font-family: var(--brand-font-feature);
  font-size: 27px;
  line-height: normal;
  font-weight: 400;
  color: var(--sb-text);
  text-align: center;
}
</style>
