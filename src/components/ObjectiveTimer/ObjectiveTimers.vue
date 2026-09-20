<script setup lang="ts">
import ObjectiveTimer from './ObjectiveTimer.vue'
import { useIngameSelector } from '@/composables/useIngame'

const baronTimer = useIngameSelector((state) => state.gameData.baronPitTimer)
const dragonTimer = useIngameSelector((state) => state.gameData.dragonPitTimer)
</script>

<template>
  <!-- v2 splits the pits to opposite top corners rather than pairing them:
       baron pit (baron / herald / grubs) top-left, dragon pit top-right. -->
  <div class="objective-timers">
    <!-- Positioned by these wrappers rather than by a class on the component:
         its root is a <Transition>, which does not forward a class reliably. -->
    <div class="timer-slot left">
      <ObjectiveTimer :objective-data="baronTimer" side="left" />
    </div>
    <div class="timer-slot right">
      <ObjectiveTimer :objective-data="dragonTimer" side="right" />
    </div>
  </div>
</template>

<style scoped>
.objective-timers {
  position: relative;
  width: 100%;
  height: 0;
}

.timer-slot {
  position: absolute;
  top: 0;
}

.timer-slot.left {
  left: 0;
}

.timer-slot.right {
  right: 0;
}
</style>
