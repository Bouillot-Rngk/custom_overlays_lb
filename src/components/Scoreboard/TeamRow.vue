<script setup lang="ts">
/**
 * One team's block in the top scoreboard — a replica of `/ingame/v2`'s
 * `.leftTeam` / `.rightTeam`:
 *
 *   [ crest | series | tag ]   [ horde | nashor | towers | gold | kills ]
 *
 * mirrored on the red side, so both crests sit on the outside and both kill
 * counts meet the centre slot. The stat icons likewise always face inward.
 *
 * Departs from v2 on type and colour: the figures are the brand's mono face in
 * white rather than v2's side-coloured numerals, so team identity is carried
 * by the flank edge, the series bars and the advantage chip instead of by the
 * text. Tracks are wider than v2's to give the mono digits room.
 */
import { BestOfType, ingameScoreboardTeamData } from '@bluebottle_gg/league-broadcast-client'
import MatchScore from './MatchScore.vue'
import { useClient } from '@/client'
import Gold from '@/assets/gold.png'
import Tower from '@/assets/tower.png'
import Horde from '@/assets/grubs.png'
import Nashor from '@/assets/baron/baron.png'
import { computed, ref, watch } from 'vue'
import FadeTransition from '../../transitions/FadeTransition.vue'
import { handleImageError, handleImageLoad } from '@/utils/imageUtils'

const props = defineProps<{
  team: ingameScoreboardTeamData
  bestOf: BestOfType
  mirror?: boolean
  enemyTeamGold?: number
  /** Nashor kills. Counted from objective events — see Scoreboard.vue. */
  barons?: number
}>()

const client = useClient()

/** Drives the flank edge, the series bars and the advantage chip — not the text. */
const teamColor = computed(() =>
  props.mirror ? 'var(--red-team-color)' : 'var(--blue-team-color)',
)

/** v2 prints a lowercase k and one decimal: "17.3k". */
const formattedGold = computed(() => {
  const gold = props.team.gold
  if (gold >= 1000) return (gold / 1000).toFixed(1) + 'k'
  return gold.toFixed(0)
})

const goldDiff = computed(() => {
  if (props.enemyTeamGold === undefined) return null
  return Math.floor(props.team.gold - props.enemyTeamGold)
})

const goldDiffText = computed(() => {
  const diff = goldDiff.value
  if (diff === null || diff <= 0) return ''
  return '+' + (diff >= 1000 ? (diff / 1000).toFixed(1) + 'k' : diff.toString())
})

// Hysteresis: show above 500, hide below 300 — prevents the advantage flicking
// on and off while the two teams trade the lead a few gold at a time.
const SHOW_THRESHOLD = 500
const HIDE_THRESHOLD = 300
const showGoldDiff = ref(false)

watch(
  goldDiff,
  (diff) => {
    if (diff === null || diff <= 0) {
      showGoldDiff.value = false
    } else if (diff > SHOW_THRESHOLD) {
      showGoldDiff.value = true
    } else if (diff < HIDE_THRESHOLD) {
      showGoldDiff.value = false
    }
    // Between HIDE_THRESHOLD and SHOW_THRESHOLD: keep current state
  },
  { immediate: true },
)
</script>

<template>
  <div class="team-block" :class="{ mirror }" :style="{ '--indicator-color': teamColor }">
    <div class="team-score">
      <p class="score-kills">{{ team.kills }}</p>

      <div class="score-item score-gold">
        <div class="gold-line">
          <img
            class="stat-icon"
            :src="Gold"
            alt=""
            @error="handleImageError"
            @load="handleImageLoad"
          />
          <p class="gold-text">{{ formattedGold }}</p>
        </div>
        <FadeTransition mode="out-in">
          <div v-if="showGoldDiff" class="gold-advantage" :style="{ background: teamColor }">
            <span class="gold-advantage-text">{{ goldDiffText }}</span>
          </div>
        </FadeTransition>
      </div>

      <div class="score-item score-tower">
        <img
          class="stat-icon"
          :src="Tower"
          alt=""
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <p class="tower-text">{{ team.towers }}</p>
      </div>

      <div class="score-item score-stat">
        <img
          class="stat-icon"
          :src="Nashor"
          alt=""
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <p class="stat-text">{{ barons ?? 0 }}</p>
      </div>

      <div class="score-item score-stat">
        <img
          class="stat-icon"
          :src="Horde"
          alt=""
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <p class="stat-text">{{ team.grubs }}</p>
      </div>
    </div>

    <div class="team-info">
      <div class="team-icon">
        <img
          v-if="team.teamIconUrl"
          :src="client.getCacheUrl(team.teamIconUrl)"
          alt=""
          @error="handleImageError"
          @load="handleImageLoad"
        />
      </div>

      <MatchScore :best-of="bestOf" :wins="team.seriesScore.wins" :mirror="mirror" />

      <div class="team-infos">
        <p class="team-name">{{ team.teamTag }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Source order is score-then-info; the blue side reverses so its crest lands
   on the outside. Both sides therefore put the kill count against the centre. */
.team-block {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  align-items: center;
  width: fit-content;
  height: 100%;
  background: var(--lb-surface-base);
  border: 1px solid var(--lb-border-subtle);
  /* Team colour down the outer flank only. With every figure now white this
     edge, the series bars and the advantage chip are the whole of the side
     cue, which is the overlay's standing rule for team colour. */
  border-left: var(--team-edge-width) solid var(--indicator-color);
  border-radius: var(--lb-radius-tile);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.44);
}

.team-block.mirror {
  flex-direction: row;
  justify-content: flex-start;
  border-left: 1px solid var(--lb-border-subtle);
  border-right: var(--team-edge-width) solid var(--indicator-color);
}

.team-info {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.team-block.mirror .team-info {
  flex-direction: row-reverse;
}

.team-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  padding: 8px;
  flex: 0 0 auto;
}

.team-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-infos {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* Le Murmure is condensed, so it still needs more than v2's 112 even at the
     smaller size the reference bar uses. */
  width: 124px;
  height: 100%;
}

.team-name {
  margin: 0;
  font-family: var(--brand-font-tag);
  /* Le Murmure only ships Regular, so weight stays at 400 rather than leaning
     on synthesis; size carries the emphasis instead. */
  font-size: 26px;
  line-height: 1;
  font-weight: 400;
  color: var(--sb-text);
  text-align: center;
}

.team-score {
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 0 14px;
  gap: 4px;
}

.team-block.mirror .team-score {
  flex-direction: row;
}

.score-kills {
  margin: 0;
  font-family: var(--brand-font-body);
  font-size: 34px;
  /* v2 declares `normal` outright. Inheriting a unitless ratio instead gives
     the figure a 1.5x line box, which overflows the 64px band. */
  line-height: normal;
  font-weight: 400;
  color: var(--sb-text);
  text-align: right;
  /* The bar is content-sized AND centre-anchored, so any change in digit count
     re-centres the whole assembly — the scoreboard visibly jumps sideways on
     every tenth kill. Reserving the width in `ch` pins it; the body face is
     monospaced, so a ch is exactly one figure. */
  min-width: 2ch;
}

.team-block.mirror .score-kills {
  text-align: left;
}

/* The gold cell is a column so the advantage can hang under the figure
   without disturbing the row it sits in. */
.score-gold {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 0 12px;
}

.gold-line {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.team-block.mirror .gold-line {
  flex-direction: row;
}

.score-tower {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  align-items: center;
  gap: 8px;
  /* Fixed, and told not to shrink: as a plain `width` the flex row collapses
     it to its content and the tower column stops lining up between teams. */
  flex: 0 0 46px;
  height: 100%;
}

.team-block.mirror .score-tower {
  flex-direction: row;
}

/* Marks are sized by height so each keeps its own aspect ratio. */
.stat-icon {
  width: auto;
  height: 19px;
  object-fit: contain;
  flex: 0 0 auto;
}

.gold-text,
.tower-text,
.stat-text {
  margin: 0;
  font-family: var(--brand-font-body);
  font-size: 20px;
  line-height: normal;
  font-weight: 400;
  color: var(--sb-text);
  text-align: center;
}

/* Same reasoning as the kills figure: hold the width so the bar cannot
   breathe as gold ticks over or a turret falls. */
.gold-text {
  min-width: 5ch;
}

.tower-text,
.stat-text {
  min-width: 2ch;
}

/* Horde and Nashor read the same way as the tower cell: mark inboard of its
   count, both sides mirrored off the centre. */
.score-stat {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex: 0 0 44px;
  height: 100%;
}

.team-block.mirror .score-stat {
  flex-direction: row;
}

/* Padded off the icon side so the advantage centres under the number rather
   than under the number-plus-icon pair. */
.gold-advantage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 15px;
  padding: 0 24px 0 8px;
}

.team-block.mirror .gold-advantage {
  padding: 0 8px 0 24px;
}

.gold-advantage-text {
  font-family: var(--brand-font-body);
  font-size: 11px;
  line-height: normal;
  font-weight: 400;
  /* The chip is filled with the side colour, so its label takes the dark ink
     rather than white — b692c4 is light enough that white on it would not
     hold up over a bright game feed. */
  color: var(--lb-surface-opaque);
}
</style>
