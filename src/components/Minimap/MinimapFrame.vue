<script setup lang="ts">
import { useIsInGame } from '@/composables/useIngame'
import FadeTransition from '../../transitions/FadeTransition.vue'

const isInGame = useIsInGame()
</script>

<template>
  <FadeTransition>
    <div v-if="isInGame" class="minimap-frame" />
  </FadeTransition>
</template>

<style scoped>
/*
 * Bezel around the game's own minimap.
 *
 * A single element whose centre is punched out by a mask, so only the ring
 * paints and the map underneath stays fully visible — no chroma key needed for
 * an OBS browser source.
 *
 * Sizing lives in views/overlay-layout.css and is measured off the real HUD,
 * not guessed; see the note there before changing it.
 */
.minimap-frame {
  pointer-events: none;

  /* Flat near-black, matching the bezel on the reference broadcast. This used
     to be an animated two-corner accent gradient left over from the old purple
     theme; the overlay's direction is black and grey with no coloured glow, and
     the reference frames the map with a plain dark band. */
  background: var(--lb-surface-strong);

  /* Rounded outside, square inside — the mask's hole is rectangular, so only
     the outer corners take the radius, which is what the reference shows. */
  border-radius: var(--lb-radius-panel);

  /* Hairline on the outer edge only: an inset shadow follows the border box,
     and the mask has already removed everything inboard of the ring. */
  box-shadow: inset 0 0 0 1px var(--lb-border-subtle);

  /*
   * Two mask layers combined with 'exclude' punch the hole:
   *   layer 1 — full-size rectangle (show everything)
   *   layer 2 — rectangle inset by --ring-width (subtract the centre)
   * exclude = layer1 XOR layer2, so only the ring survives.
   *
   * The HUD's own bezel is not symmetric — it runs 28px on the left and 30px
   * at the top (the gold corner ornament lives there) but only 20px right and
   * 18px bottom. 16px is therefore the widest ring that still clears the map
   * itself on every side, while hiding the ornament the way the reference
   * broadcast does.
   */
  --ring-width: 16px;
  mask-image: linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
  mask-size:
    100% 100%,
    calc(100% - var(--ring-width) * 2) calc(100% - var(--ring-width) * 2);
  mask-position: center, center;
  mask-repeat: no-repeat, no-repeat;
  mask-composite: exclude;
  -webkit-mask-image: linear-gradient(#fff 0 0), linear-gradient(#fff 0 0);
  -webkit-mask-size:
    100% 100%,
    calc(100% - var(--ring-width) * 2) calc(100% - var(--ring-width) * 2);
  -webkit-mask-position: center, center;
  -webkit-mask-repeat: no-repeat, no-repeat;
  -webkit-mask-composite: xor;
}
</style>
