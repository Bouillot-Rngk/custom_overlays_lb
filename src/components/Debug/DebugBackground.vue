<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Optional solid-color `?bg=` background for overlay routes, dev builds only.
 * The default remains transparent for browser-source use. Supported values:
 *   bg=dark            — flat dark
 *   bg=frame           — the broadcast frame artwork (public/fs_background.png),
 *                        for checking that overlay elements land on the art
 *   bg=<any CSS color> — e.g. bg=green or bg=%23202833
 *   bg=none            — force transparent
 */
const route = useRoute()

const bg = computed(() => {
  // A leftover development parameter must never paint over a production feed.
  if (!import.meta.env.DEV) return ''

  // Route queries are canonical. Keep the direct location fallback for preview
  // harnesses that mount this component without Vue Router owning the query.
  const fromRoute = typeof route.query.bg === 'string' ? route.query.bg : ''
  const fromSearch = new URLSearchParams(window.location.search).get('bg') ?? ''
  const param = fromRoute || fromSearch
  return param === 'none' || param === 'off' ? '' : param
})

const style = computed(() => {
  if (!bg.value) return undefined
  if (bg.value === 'dark') return { background: '#10131a' }
  // The art is 1920x1080 with a transparent stage window; the flat colour
  // behind it stands in for whatever the window is composited over.
  if (bg.value === 'frame')
    return {
      backgroundColor: '#10131a',
      backgroundImage: 'url(/fs_background.png)',
      backgroundSize: '1920px 1080px',
      backgroundPosition: 'top left',
      backgroundRepeat: 'no-repeat',
    }
  return { background: bg.value }
})
</script>

<template>
  <div v-if="style" class="debug-bg" :style="style" />
</template>

<style scoped>
/* Rendered as the first child of .overlay: absolutely positioned siblings
   paint in DOM order, so this stays behind every element without z-index. */
.debug-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
