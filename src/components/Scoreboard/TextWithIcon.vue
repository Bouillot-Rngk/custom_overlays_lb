<script setup lang="ts">
const props = defineProps<{
  text: string
  iconUrl?: string
  mirror?: boolean
  /** Reserve a fixed width for the text (e.g. "2ch") so changing values don't shift the layout. */
  textWidth?: string
}>()
</script>

<template>
  <div class="flex items-center gap-2" :class="mirror ? 'flex-row-reverse' : 'flex-row'">
    <img v-if="iconUrl" :src="iconUrl" alt="Icon" class="stat-icon object-contain shrink-0" />
    <span
      class="stat-text"
      :style="
        textWidth
          ? {
              minWidth: textWidth,
              textAlign: mirror ? 'right' : 'left',
            }
          : undefined
      "
      >{{ text }}</span
    >
  </div>
</template>

<style scoped>
/* Gold and tower marks are chrome, not game state, so they read as grey
   glyphs alongside the numbers instead of as two more colors on the bar. */
.stat-icon {
  width: 21px;
  height: 21px;
  filter: grayscale(1) brightness(1.45);
  opacity: 0.8;
}

.stat-text {
  color: var(--text-primary);
  font-size: 21px;
  line-height: 1;
  font-weight: 700;
}
</style>
