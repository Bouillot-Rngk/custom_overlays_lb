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
  <div class="team-block" :class="{ mirror }" :style="{ '--side-color': teamColor }">
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
  /* max-content, not fit-content: inside a 1fr track fit-content resolves
     against the track's own (still unresolved) size during intrinsic sizing,
     so the track came out ~24px short and the score row spilled over the tag
     and the centre mark. max-content contributes the real width instead. */
  width: max-content;
  height: 100%;
  background: var(--lb-surface-base);
  border: 1px solid var(--lb-border-subtle);
  /* Team colour down the outer flank only. With every figure now white this
     edge, the series bars and the advantage chip are the whole of the side
     cue, which is the overlay's standing rule for team colour. */
  border-left: var(--team-edge-width) solid var(--side-color);
  border-radius: var(--lb-radius-tile);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.44);
  /* So the crest's colour block takes the corner radius at the outer edge. */
  overflow: hidden;
}

.team-block.mirror {
  flex-direction: row;
  justify-content: flex-start;
  border-left: 1px solid var(--lb-border-subtle);
  border-right: var(--team-edge-width) solid var(--side-color);
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

/* The crest sits on the side colour — the strip from the block's outer edge in
   to the series bars, and no further. `height: 100%` rather than v2's 64px:
   the band is 58px tall now, so a fixed 64 overhung it top and bottom, which
   went unnoticed while this cell was transparent. */
.team-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 100%;
  /* 4px, not 8: the supplied crests are 512x512 with their own margin already
     drawn in, so a generous inset here just shrinks the mark twice over. The
     cell is height-bound, so every pixel of padding costs a pixel of logo. */
  padding: 4px;
  flex: 0 0 auto;
  background: var(--side-color);
}

/* contain, never cover. The cell is wider than it is tall, so `cover` scaled a
   square crest to the width and cropped the top and bottom off it — which is
   what was clipping the blue side's mark. `contain` fits the whole logo and
   letterboxes the difference, and it keeps non-square wordmarks intact too. */
.team-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* The tag belongs to the score group, not to the crest: it sits hard against
   the stats (12px, counting the score row's own padding) with a wider 24px
   channel back to the series bars. Sized to content rather than to a fixed
   track — a fixed one left a ~95px void here, since Le Murmure sets a
   three-letter tag in barely 23px. */
.team-infos {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding: 0 2px 0 24px;
  min-width: 52px;
  height: 100%;
}

.team-block.mirror .team-infos {
  align-items: flex-start;
  padding: 0 24px 0 2px;
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
  /* Asymmetric on purpose: less on the tag side so the two groups close up,
     more on the centre side so the kill count keeps clear of the swords mark.
     With the track's own 6px this leaves the same 18px between the tag and the
     first mark as between every other pair. */
  padding: 0 18px 0 10px;
  gap: 18px;
}

.team-block.mirror .team-score {
  padding: 0 10px 0 18px;
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

/* Mark then figure, the same way round on both sides. The reference bar does
   NOT mirror these pairs — only their order along the bar is mirrored — so the
   gold coin sits outboard on blue and inboard on red, and both read left to
   right. */
.gold-line {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.score-tower {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
  /* Sized to content: the figures already hold their own width in `ch`, so the
     row's gap is what sets the rhythm. A fixed cell width would swallow part of
     that gap into the cell's own centring instead. */
  flex: 0 0 auto;
  height: 100%;
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

/* Horde and Nashor read the same way as the tower cell. */
.score-stat {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  height: 100%;
}

/* The two objective marks are full-colour art next to what are otherwise plain
   white glyphs — Nashor especially reads as a purple blob at 19px. Flattened
   so the five cells read as one set, which is how the reference bar treats
   them. */
.score-stat .stat-icon {
  filter: grayscale(1) brightness(1.45);
}

/* Padded off the icon side so the advantage centres under the number rather
   than under the number-plus-icon pair. */
.gold-advantage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 15px;
  /* The figure is the right-hand half of the pair on both sides, so the chip
     is padded off the mark rather than mirrored. */
  padding: 0 4px 0 22px;
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
