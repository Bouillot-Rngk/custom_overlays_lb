<script setup lang="ts">
/**
 * One inventory tile — a replica of LeagueBroadcast's own `/ingame/v2`
 * `.item-slot`. Geometry, colours and the cooldown sweep were read off that
 * overlay's live DOM, so the numbers here are its numbers.
 *
 * The tile is always painted, empty or not: v2 renders all eight slots so the
 * inventory keeps a fixed footprint and items do not shuffle as they are bought.
 */
import { useClient } from '@/client'
import { computed } from 'vue'
import { getItemCooldownFraction } from '@bluebottle_gg/league-broadcast-client'
import type { itemWithAsset } from '@bluebottle_gg/league-broadcast-client'
import { handleImageError, handleImageLoad } from '@/utils/imageUtils'
import { useGameClock } from '@/composables/useGameClock'

const props = withDefaults(
  defineProps<{
    item?: itemWithAsset
    /** Set on the trinket only: shows the player's vision score on the tile. */
    visionScore?: number
    showStacks?: boolean
  }>(),
  {
    showStacks: true,
  },
)

const client = useClient()
const gameTime = useGameClock()

const isEmpty = computed(() => !props.item || props.item.id === 0)

/**
 * Degrees of the sweep already elapsed, or `null` while the item is ready.
 *
 * Read through one rounded value rather than off the clock directly: the template then
 * only re-renders when the sweep actually moves a whole degree (sub-pixel at icon size),
 * instead of on every animation frame for every item in the scoreboard.
 */
const elapsedDegrees = computed(() => {
  const fraction = getItemCooldownFraction(props.item, gameTime.value)
  return fraction >= 1 ? null : Math.round(360 * fraction)
})

/**
 * The tile's corner badge. v2 draws three mutually exclusive kinds, in this
 * order, and nothing at all for a plain single item.
 */
const badge = computed<{ kind: 'vision' | 'stacks' | 'count'; text: string } | undefined>(() => {
  if (!props.showStacks) return undefined

  if (props.visionScore !== undefined) {
    return { kind: 'vision', text: Math.round(props.visionScore).toString() }
  }

  const item = props.item
  if (!item) return undefined

  // Charges (trinket uses, Control Wards) read as a stack count on the tile.
  if (item.charges && item.charges > 0) {
    return { kind: 'stacks', text: format(item.charges) }
  }

  const stacks = item.stacks ?? 0
  if (stacks > 0 && stacks < 1000) {
    return { kind: 'stacks', text: Math.floor(stacks).toString() }
  }

  if (item.count > 1) {
    return { kind: 'count', text: format(item.count) }
  }

  return undefined
})

function format(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(1) + 'k'
  return Math.floor(value).toString()
}
</script>

<template>
  <div class="item-slot" :style="{ '--cooldown': (elapsedDegrees ?? 0) + 'deg' }">
    <template v-if="!isEmpty && item">
      <img
        v-if="item.modifierUrl"
        class="item-image item-modifier"
        :src="client.getCacheUrl(item.modifierUrl)"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <img
        class="item-image"
        :src="client.getCacheUrl(item.assetUrl)"
        @error="handleImageError"
        @load="handleImageLoad"
      />

      <span v-if="badge" class="item-value" :class="'item-value-' + badge.kind">{{
        badge.text
      }}</span>

      <!-- Radial depletion only: v2 draws no clock hand over the icon. -->
      <span v-if="elapsedDegrees !== null" class="item-cooldown" />
    </template>
  </div>
</template>

<style scoped>
/* Measurements taken from the live /ingame/v2 DOM. v2 expresses these in rem
   against a 16px root; they are written out in px here so the tile cannot be
   resized by a stray root font-size in an OBS source. */
.item-slot {
  position: relative;
  width: 30.4px;
  height: 30.4px;
  flex: 0 0 auto;
  border: 1px solid var(--lb-border-subtle);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.35);
  background: var(--lb-surface-raised);
  overflow: hidden;
}

.item-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

/* Ornn upgrades and similar paint their plate under the item art. */
.item-modifier {
  z-index: 1;
}

.item-value {
  position: absolute;
  right: 1px;
  bottom: 1px;
  z-index: 3;
  font-family: var(--brand-font-body);
  font-size: 11.52px;
  line-height: 1;
  font-weight: 700;
  text-align: center;
  color: var(--lb-text-secondary);
  /* Eight-way 1px outline plus a soft bloom — v2's treatment, so the digits
     survive over a bright item icon. */
  text-shadow: var(--lb-text-outline);
}

.item-cooldown {
  position: absolute;
  inset: 0;
  z-index: 2;
  /* --cooldown is the sweep already elapsed, so the scrim is what remains.
     The 0deg stop is clamped up to --cooldown by the gradient itself. */
  background: conic-gradient(transparent var(--cooldown), var(--lb-surface-strong) 0deg);
}
</style>
