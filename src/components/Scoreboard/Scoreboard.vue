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
import { computed, onUnmounted, ref, watch } from 'vue'
import {
  ObjectiveEventType,
  type ingameObjectiveEvent,
} from '@bluebottle_gg/league-broadcast-client'
import {
  GameState,
  type ingameScoreboardBottomPlayerData,
} from '@bluebottle_gg/league-broadcast-client'
import { useIngameSelector } from '@/composables/useIngame'
import { useClient } from '@/client'
import CentreLogo from '@/assets/VERTICALE_WHITE.png'
import TeamRow from './TeamRow.vue'
import TeamObjectiveRow from './TeamObjectiveRow.vue'
import RoleQuestRow from './RoleQuestRow.vue'
import DragonBuffBanner from './DragonBuffBanner.vue'

const client = useClient()
const scoreboard = useIngameSelector((s) => s.gameData.scoreboard)

/*
 * Role quests are drawn in THIS scoreboard, so they live and die with it — not
 * with the bottom row. The catch is that the quest item only exists on the
 * bottom-scoreboard record, and the operator can hide that independently, at
 * which point the backend stops sending it.
 *
 * So the last non-empty roster is held rather than read straight through.
 * Hiding the bottom row leaves these badges showing their last known state
 * instead of blanking them. Quest progress only ever moves forward, so a held
 * value can lag, never contradict.
 */
const bottom = useIngameSelector((s) => s.gameData.scoreboardBottom)
const isMocking = useIngameSelector((s) => (s.gameState as number) === GameState.Mocking)

const heldPlayers = ref<[ingameScoreboardBottomPlayerData[], ingameScoreboardBottomPlayerData[]]>([
  [],
  [],
])

watch(
  bottom,
  (next) => {
    const blue = next?.teams[0]?.players ?? []
    const red = next?.teams[1]?.players ?? []
    if (blue.length || red.length) heldPlayers.value = [blue, red]
  },
  { immediate: true },
)

// A new game must not inherit the last one's quest state.
watch(
  () => scoreboard.value?.gameTime ?? 0,
  (now, before) => {
    if (before !== undefined && now < before - 30) heldPlayers.value = [[], []]
  },
)

const bluePlayers = computed(() => heldPlayers.value[0])
const redPlayers = computed(() => heldPlayers.value[1])

const blue = computed(() => scoreboard.value?.teams[0])
const red = computed(() => scoreboard.value?.teams[1])

const gameTime = computed(() => {
  if (!scoreboard.value) return '00:00'
  const minutes = Math.floor(scoreboard.value.gameTime / 60)
  const seconds = Math.floor(scoreboard.value.gameTime % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

/**
 * Nashor kills per side.
 *
 * The scoreboard payload carries towers, plates, grubs and dragons but NOT a
 * baron count, so this is tallied from objective kill events instead. That has
 * one consequence worth knowing: the tally only covers events seen since this
 * overlay connected, so reloading the browser source mid-game restarts it at
 * zero. Everything else on the bar is a snapshot and survives a reload.
 *
 * Field shapes are matched loosely because the feed is not strict about them:
 * the objective name may be `BARON` or a `SRU_Baron`-style id, the event type
 * may be the string `Kill` or the enum's 1, and the team may be 0/1 or 100/200.
 */
const baronKills = ref<[number, number]>([0, 0])

function isBaronKill(event: ingameObjectiveEvent): boolean {
  const objective = String(event.objective ?? '').toUpperCase()
  if (!objective.includes('BARON') && !objective.includes('NASHOR')) return false
  const type = String(event.eventType ?? '').toUpperCase()
  return type === 'KILL' || type === String(ObjectiveEventType.Kill)
}

const unsubscribe = client.onIngameEvents({
  onObjectiveEvent(event: ingameObjectiveEvent) {
    if (!isBaronKill(event)) return
    const side = event.team === 1 || event.team === 200 ? 1 : 0
    const next: [number, number] = [...baronKills.value]
    next[side] += 1
    baronKills.value = next
  },
})

// A game restart rewinds the clock; the tally has to rewind with it or the new
// game inherits the last one's barons.
watch(
  () => scoreboard.value?.gameTime ?? 0,
  (now, before) => {
    if (before !== undefined && now < before - 30) baronKills.value = [0, 0]
  },
)

onUnmounted(unsubscribe)
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
            :barons="baronKills[0]"
          />
          <!-- Brand mark between the two kill counts. -->
          <div class="centre-mark">
            <img :src="CentreLogo" alt="" />
          </div>
          <TeamRow
            class="team-block team-block-right"
            :team="red"
            :best-of="scoreboard.bestOf"
            :enemy-team-gold="blue.gold"
            mirror
            :barons="baronKills[1]"
          />
        </div>
      </div>

      <div class="row-clip row-clip-wide">
        <div class="bottom-row">
          <div class="quest-slot">
            <RoleQuestRow :players="bluePlayers" :is-mocking="isMocking" />
          </div>

          <div class="bottom-content">
            <TeamObjectiveRow :team="blue" />
            <div class="game-timer">
              <p class="game-timer-text">{{ gameTime }}</p>
            </div>
            <TeamObjectiveRow :team="red" mirror />
          </div>

          <div class="quest-slot mirror">
            <RoleQuestRow :players="redPlayers" :is-mocking="isMocking" mirror />
          </div>
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
  grid-template-columns: 1fr 52px 1fr;
  grid-template-rows: 58px;
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

.centre-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--lb-surface-base);
  border-radius: var(--lb-radius-tile);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.44);
  /* Clips the artwork's transparent surround, not the mark — see below. */
  overflow: hidden;
}

/*
 * VERTICALE_WHITE.png is a 1921x1081 export whose visible mark is only
 * 308x546, sitting in transparent padding: the mark is ~50.5% of the file's
 * height. Sizing the file to the band would therefore render the mark at half
 * the height asked for, so the image is oversized to ~170% and the empty
 * surround is clipped by the parent. Nothing visible is cropped — the mark is
 * 28px wide at this size, well inside the 52px slot.
 *
 * The 170% is that one file's padding ratio, not a layout constant: a logo
 * exported tight to its bounds wants `height: calc(100% - 8px)` and no clip.
 */
.centre-mark img {
  height: 170%;
  width: auto;
  max-width: none;
  object-fit: contain;
  flex: 0 0 auto;
}

/* The column centres its children, which shrink-wraps them. The bottom row has
   to span the whole scoreboard instead, or its side slots have no width to push
   the quest badges out into. */
.row-clip-wide {
  align-self: stretch;
}

/* Quest badges at the two outer edges, objective band dead centre. The side
   slots take equal flexible width and the band none, so the clock stays on the
   frame's midline even when one side has finished its quests and the other
   has not. */
.bottom-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
}

.quest-slot {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  justify-content: flex-start;
  padding-left: 4px;
}

.quest-slot.mirror {
  justify-content: flex-end;
  padding-left: 0;
  padding-right: 4px;
}

.bottom-content {
  flex: 0 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 27px;
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
  width: 78px;
  height: 100%;
}

/* The clock is this scene's one hero number, so it takes the feature face —
   the same role the countdown plays on the draft bar. */
.game-timer-text {
  margin: 0;
  font-family: var(--brand-font-feature);
  font-size: 21px;
  line-height: normal;
  font-weight: 400;
  color: var(--sb-text);
  text-align: center;
}
</style>
