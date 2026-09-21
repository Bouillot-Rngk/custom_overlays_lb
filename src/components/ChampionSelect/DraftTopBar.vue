<script setup lang="ts">
/**
 * Draft header: the light full-width bar across the top of the champion-select
 * scene. Team crests and series dots sit in the outer zones (aligned to the
 * pick columns below them), with the match banner floating between.
 *
 * The header paints no background of its own: the bar and the banner are both
 * transparent so artwork layered behind the overlay shows through. Only the
 * crests, dots and type belong to this component.
 *
 * To let the overlay carry the art instead, set `background-image` on
 * `.draft-top-bar` (full-width bar) and/or `.banner-bg` (centre banner) in the
 * style block below. Both boxes are already sized and positioned, so adding an
 * image moves nothing else.
 */
import { computed } from 'vue'
import { BestOfType, type championSelectTeam } from '@bluebottle_gg/league-broadcast-client'
import { useClient } from '@/client'
import { resolveCoaches } from '@/composables/useChampSelect'
import { handleImageError, handleImageLoad } from '@/utils/imageUtils'

const props = defineProps<{
  blueTeam: championSelectTeam
  redTeam: championSelectTeam
  bestOf: BestOfType
  patch?: string
  timeRemaining?: number
}>()

const client = useClient()

/** Dots = games needed to win the series, matching the in-game MatchScore. */
const dotCount = computed(() => Math.max(1, Math.ceil(Number(props.bestOf) / 2)))

function sideOf(team: championSelectTeam) {
  const coaches = resolveCoaches(team)
  return {
    tag: team.metaData?.tag ?? '',
    name: team.metaData?.name ?? '',
    icon: team.metaData?.iconUri ? client.getCacheUrl(team.metaData.iconUri) : '',
    wins: team.scoreMatch?.wins ?? 0,
    coaches,
    // "COACH" vs "COACHES" — a one-coach team reading "COACHES : X" looks like
    // a truncation bug on a broadcast still.
    coachLabel: coaches.length > 1 ? 'COACHES' : 'COACH',
  }
}

const blue = computed(() => sideOf(props.blueTeam))
const red = computed(() => sideOf(props.redTeam))

/** Whole seconds, floored, so it counts the way a caster reads a clock. */
const clock = computed(() => {
  const t = props.timeRemaining
  if (t === undefined || !Number.isFinite(t) || t < 0) return '0'
  return String(Math.floor(t))
})

const shortPatch = computed(() => props.patch?.split('.').slice(0, 2).join('.') ?? '')
</script>

<template>
  <div class="draft-top-bar">
    <!-- Outer zones: crest over series dots, one per side -->
    <div class="crest-zone">
      <img
        v-if="blue.icon"
        class="crest"
        :src="blue.icon"
        :alt="blue.name"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div class="series-dots">
        <span v-for="i in dotCount" :key="i" class="dot" :class="{ won: i <= blue.wins }" />
      </div>
    </div>

    <div class="banner">
      <div class="banner-bg" />

      <div class="banner-side side-blue">
        <span class="side-league">{{ blue.name }}</span>
        <span class="side-tag">{{ blue.tag }}</span>
        <span v-if="blue.coaches.length" class="side-coach">
          {{ blue.coachLabel }} : {{ blue.coaches.join(' & ') }}
        </span>
      </div>

      <div class="banner-centre">
        <span class="centre-title">PICKS &amp; BANS</span>
        <span class="centre-clock">{{ clock }}</span>
        <span v-if="shortPatch" class="centre-patch">PATCH : {{ shortPatch }}</span>
      </div>

      <div class="banner-side side-red">
        <span class="side-league">{{ red.name }}</span>
        <span class="side-tag">{{ red.tag }}</span>
        <span v-if="red.coaches.length" class="side-coach">
          {{ red.coachLabel }} : {{ red.coaches.join(' & ') }}
        </span>
      </div>
    </div>

    <div class="crest-zone">
      <img
        v-if="red.icon"
        class="crest"
        :src="red.icon"
        :alt="red.name"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div class="series-dots">
        <span v-for="i in dotCount" :key="i" class="dot" :class="{ won: i <= red.wins }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The draft scene owns the whole frame, so unlike the in-game overlay it can
   carry a light surface — there is no game feed underneath to read through it. */
.draft-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: var(--draft-header-height, 222px);
  display: grid;
  /* Outer columns match the pick-column width below, so each crest sits
     centred over its own team's cards. */
  grid-template-columns:
    var(--draft-column-width, 392px)
    1fr
    var(--draft-column-width, 392px);
  align-items: center;
  /* Transparent by design — see the block comment above. No bottom rule
     either: over supplied artwork a hairline here reads as a stray seam. */
  background: none;
}

.crest-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 100%;
  padding-bottom: 8px;
}

.crest {
  height: 116px;
  max-width: 76%;
  object-fit: contain;
}

.series-dots {
  display: flex;
  gap: 16px;
}

/* Empty ring = game not yet won. Filled = won, so the series reads at a glance
   without a number to parse. */
.dot {
  width: 21px;
  height: 21px;
  border-radius: 50%;
  border: 2px solid #17171a;
  background: transparent;
}

.dot.won {
  background: #17171a;
}

/* Geometry taken from the banner artwork in public/fs_background.png, which
   occupies x 395-1524, y 27-206. The header grid's middle track already spans
   394-1526, so a 1px inset lands the box on the art; `align-self: start` plus
   the top margin pins it vertically instead of centring it in the bar. */
.banner {
  position: relative;
  align-self: start;
  height: 180px;
  margin: 27px 1px 0;
  border-radius: 30px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 44px;
  color: #ffffff;
}

/* Kept as an empty, correctly-sized box so banner artwork can be dropped in
   later without touching the layout:
     background-image: url('@/assets/champselect/banner-bg.png');
     background-size: cover; background-position: center; */
.banner-bg {
  position: absolute;
  inset: 0;
  background: none;
}

.banner-side {
  position: relative;
  display: grid;
  gap: 2px;
  min-width: 0;
}

.side-blue {
  justify-items: start;
  text-align: left;
}

.side-red {
  justify-items: end;
  text-align: right;
}

/* Full team name above the tag: the reference frame carries a league label
   here, which the champ-select payload does not provide. The name is the
   closest real field and keeps the same two-tier hierarchy. */
.side-league {
  font-size: 19px;
  line-height: 1;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* A long club name would otherwise push into the clock. Truncation is the
     right failure here: the tag underneath still identifies the team. */
  max-width: 340px;
}

/* Team tag: Le Murmure, the one display face on the bar. Regular is the only
   cut that ships, so the weight says 400 rather than leaning on synthesis. */
.side-tag {
  font-family: var(--brand-font-tag);
  font-size: 72px;
  line-height: 0.96;
  font-weight: 400;
}

.side-coach {
  font-size: 17px;
  line-height: 1;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.banner-centre {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 0 40px;
}

.centre-title {
  font-size: 21px;
  line-height: 1;
  font-weight: 700;
}

/* The draft clock is the one number anyone looks for on this bar. Coconat
   Regular; its BoldExt cut is registered at weight 700 if this wants more
   presence. tabular-nums is dropped: Coconat has no tabular figures, so asking
   for them silently does nothing, and the clock is a 1-2 digit countdown that
   does not shift. */
.centre-clock {
  font-family: var(--brand-font-feature);
  font-size: 62px;
  line-height: 1;
  font-weight: 400;
}

.centre-patch {
  font-size: 17px;
  line-height: 1;
  font-weight: 600;
}
</style>
