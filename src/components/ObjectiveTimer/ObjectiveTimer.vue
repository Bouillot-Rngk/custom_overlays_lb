<script setup lang="ts">
import {
  IngameObjectiveType,
  getRemaining,
  type iObjectiveRespawnData,
} from '@bluebottle_gg/league-broadcast-client'
import { computed } from 'vue'
import Baron from '@/assets/baron/baron.png'
import Herald from '@/assets/baron/herald.png'
import Grub from '@/assets/baron/grubs.png'
import AirDragon from '@/assets/dragon/air.png'
import ChemtechDragon from '@/assets/dragon/chemtech.png'
import HextechDragon from '@/assets/dragon/hextech.png'
import EarthDragon from '@/assets/dragon/earth.png'
import FireDragon from '@/assets/dragon/fire.png'
import WaterDragon from '@/assets/dragon/water.png'
import ElderDragon from '@/assets/dragon/elder.png'
import FadeTransition from '../../transitions/FadeTransition.vue'
import { useGameClock } from '@/composables/useGameClock'
import { useClient } from '@/client'

const props = withDefaults(
  defineProps<{
    objectiveData?: iObjectiveRespawnData
    /** Which screen edge this chip hangs from; decides icon side and rounding. */
    side?: 'left' | 'right'
  }>(),
  {
    objectiveData: undefined,
    side: 'left',
  },
)

const gameTime = useGameClock()
const client = useClient()

/**
 * The pit's generic dragon plate. There is no bundled asset for an unspecified
 * dragon, so this points at the same backend style asset /ingame/v2 uses for
 * DRAGON_CLASSIC and for a pit whose type has not resolved yet.
 */
const GENERIC_DRAGON = 'style/ingame/objectives/dragonpit/dragon_square.png'

const isDragonPit = computed(() =>
  String(props.objectiveData?.mapSide ?? '')
    .toLowerCase()
    .includes('dragon'),
)

const objectiveType = computed(() => {
  if (!props.objectiveData) return undefined
  //parse type to enum, it might be a string or a number, so we have to handle both cases.
  return typeof props.objectiveData.type === 'string'
    ? IngameObjectiveType[props.objectiveData.type as keyof typeof IngameObjectiveType]
    : props.objectiveData.type
})

const respawnTimeRemaining = computed(() => {
  if (!props.objectiveData || props.objectiveData.timeAlive === undefined) return undefined
  const time = getRemaining(props.objectiveData.timeAlive, gameTime.value)
  return time > 0 ? time : 0
})

// Quantized so the template never reads the continuously-advancing remaining time directly.
const hasTimer = computed(
  () => respawnTimeRemaining.value !== undefined && respawnTimeRemaining.value > 0,
)
const formattedRespawnTime = computed(() => {
  if (respawnTimeRemaining.value === undefined) return ''
  const time = respawnTimeRemaining.value
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const objectiveIcon = computed(() => {
  if (!props.objectiveData) return Baron
  //parse type to enum, it might be a string or a number, so we have to handle both cases.
  const type = objectiveType.value
  switch (type) {
    case IngameObjectiveType.BARON:
      return Baron
    case IngameObjectiveType.HERALD:
      return Herald
    case IngameObjectiveType.GRUB:
      return Grub
    case IngameObjectiveType.DRAGON_AIR:
      return AirDragon
    case IngameObjectiveType.DRAGON_CHEMTECH:
      return ChemtechDragon
    case IngameObjectiveType.DRAGON_HEXTECH:
      return HextechDragon
    case IngameObjectiveType.DRAGON_EARTH:
      return EarthDragon
    case IngameObjectiveType.DRAGON_FIRE:
      return FireDragon
    case IngameObjectiveType.DRAGON_WATER:
      return WaterDragon
    case IngameObjectiveType.DRAGON_ELDER:
      return ElderDragon
    case IngameObjectiveType.DRAGON_CLASSIC:
      return client.getCacheUrl(GENERIC_DRAGON)
    default:
      // UNDEFINED and anything new: fall back per pit rather than to a fixed
      // icon, so an unresolved dragon never shows the baron plate.
      return isDragonPit.value ? client.getCacheUrl(GENERIC_DRAGON) : Baron
  }
})
</script>

<template>
  <FadeTransition>
    <div v-if="objectiveType !== undefined" class="spawn-timer" :class="side">
      <div class="timer-icon">
        <img :src="objectiveIcon" alt="Objective Icon" />
      </div>

      <div class="timer-info" :class="{ collapsed: !hasTimer }">
        <p class="timer-time">{{ formattedRespawnTime }}</p>
      </div>
    </div>
  </FadeTransition>
</template>

<style lang="css" scoped>
/* A replica of LeagueBroadcast's own /ingame/v2 `.spawn-timer-v2`: a 40px
   chip hung off the top corner of the frame, icon tile outermost and the
   clock reading inward. Values were read off that overlay's live DOM.
   Screen placement lives in views/overlay-layout.css. */
.spawn-timer {
  display: flex;
  align-items: stretch;
  gap: 2px;
  height: 40px;
  border: 1px solid var(--lb-border-strong);
  background: var(--lb-surface-strong);
  box-shadow: 0 2px 12px rgb(0 0 0 / 0.64);
}

/* Square against the screen edge; only the inner bottom corner is rounded. */
.spawn-timer.left {
  flex-direction: row;
  border-radius: 0 0 var(--lb-radius-chip) 0;
}

.spawn-timer.right {
  flex-direction: row-reverse;
  border-radius: 0 0 0 var(--lb-radius-chip);
}

.timer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  padding: 6px;
  background: var(--lb-surface-raised);
  flex: 0 0 auto;
}

/* v2 shows these at full colour on the raised tile rather than desaturating
   them: at 24px on a grey plate they no longer compete with the game feed. */
.timer-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.timer-info {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  /* Well clear of any clock string; it exists only so the fold below has a
     concrete value to animate from — width itself is content-driven. */
  max-width: 200px;
  height: 100%;
  padding: 0 12px;
  background: var(--lb-surface-base);
  overflow: hidden;
  transition:
    max-width 0.3s ease-in-out,
    min-width 0.3s ease-in-out,
    padding 0.3s ease-in-out;
}

/* Objective is up, so the clock half folds away and leaves just the icon.
   max-width has to go too: with only min-width and padding cleared, the
   clock string still sets the panel's width and it never closes. */
.timer-info.collapsed {
  max-width: 0;
  min-width: 0;
  padding: 0;
}

.timer-time {
  font-family: var(--lb-font-numeric);
  font-size: 16.8px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-align: center;
  color: var(--lb-text-primary);
  white-space: nowrap;
}
</style>
