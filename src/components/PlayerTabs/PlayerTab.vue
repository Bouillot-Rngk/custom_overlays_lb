<script setup lang="ts">
/**
 * Champion tab — a replica of LeagueBroadcast's own `/ingame/v2` tab.
 *
 * Geometry and colours below were read off that overlay's live DOM rather than
 * eyeballed from a screenshot, so the numbers are its numbers: a 72x72 tile
 * under a 12px name plate, a 23px ability rail inset 2px, a 47x48 portrait, and
 * a 24px status block of XP / health / resource tracks.
 *
 * The ability rail holds summoner D, summoner F and the player's keystone rune
 * — not a third spell. That third slot is `tabPlayer.perks[0]`.
 */
import { computed, toRef } from 'vue'
import type {
  ingameScoreboardBottomPlayerData,
  tabPlayer,
} from '@bluebottle_gg/league-broadcast-client'
import { useClient } from '@/client'
import { usePlayerVitals } from '@/composables/usePlayerVitals'
import SpellWithCooldown from '../PlayerScoreboard/SpellWithCooldown.vue'

const props = defineProps<{
  scoreboardPlayer?: ingameScoreboardBottomPlayerData
  tabPlayer?: tabPlayer
  /** Red side: the tile flips so the ability rail faces the screen edge. */
  mirror?: boolean
}>()

const client = useClient()

const {
  isDead,
  respawnTimeRemaining,
  ultimate,
  summonerOne,
  summonerTwo,
  playerName,
  xpProgress,
  healthPct,
  resourcePct,
  resourceColor,
} = usePlayerVitals(toRef(props, 'scoreboardPlayer'), toRef(props, 'tabPlayer'))

const championIcon = computed(() => client.getCacheUrl(props.scoreboardPlayer?.champion?.squareImg))

/** Keystone: the first perk the backend sends for this player. */
const keystone = computed(() => {
  const path = props.tabPlayer?.perks?.[0]?.iconPath
  return path ? client.getCacheUrl(path) : ''
})

// Champion counter (Nasus stacks, Veigar AP, Sion souls...).
const stacks = computed(() => {
  const raw = props.tabPlayer?.stacksData
  return raw === undefined || raw === null ? undefined : Math.round(raw)
})
</script>

<template>
  <div class="champion-tab-shell" :class="{ mirror, 'is-dead': isDead }">
    <div class="name-label">
      <span class="name-text">{{ playerName }}</span>
    </div>

    <div class="champion-tab">
      <div class="abilities">
        <SpellWithCooldown
          class="ability"
          :ready-at="summonerOne?.readyAt"
          :total-cooldown="summonerOne?.totalCooldown"
          :img="client.getCacheUrl(summonerOne?.assets?.iconAsset)"
          show-timer
          skilled
          :is-toggled="summonerOne?.isToggled"
        />
        <SpellWithCooldown
          class="ability"
          :ready-at="summonerTwo?.readyAt"
          :total-cooldown="summonerTwo?.totalCooldown"
          :img="client.getCacheUrl(summonerTwo?.assets?.iconAsset)"
          show-timer
          skilled
          :is-toggled="summonerTwo?.isToggled"
        />
        <!-- Keystone has no cooldown, so it is a plain icon rather than a slot. -->
        <div class="ability keystone">
          <img v-if="keystone" :src="keystone" alt="" />
        </div>
      </div>

      <img v-if="championIcon" class="portrait" :src="championIcon" alt="" />

      <span class="level">{{ scoreboardPlayer?.level }}</span>
      <span v-if="stacks !== undefined" class="stacks">{{ stacks }}</span>

      <!-- Overhangs the tile's outer edge by 6px, as it does in v2. -->
      <SpellWithCooldown
        class="ultimate"
        :ready-at="ultimate?.readyAt"
        :total-cooldown="ultimate?.totalCooldown"
        :img="client.getCacheUrl(ultimate?.assets?.iconAsset)"
        show-timer
        :skilled="(ultimate?.level ?? 0) > 0"
        :is-toggled="ultimate?.isToggled"
      />

      <div class="status">
        <div class="track track-xp">
          <div class="fill" :style="{ width: xpProgress + '%', backgroundColor: '#6051ff' }" />
        </div>
        <div class="track track-health">
          <div class="fill" :style="{ width: healthPct + '%', backgroundColor: '#62e870' }" />
        </div>
        <div class="track track-resource">
          <div class="fill" :style="{ width: resourcePct + '%', backgroundColor: resourceColor }" />
        </div>
      </div>

      <div v-if="isDead" class="respawn">{{ respawnTimeRemaining }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Measurements taken from the live /ingame/v2 DOM. Keep them together so the
   tile can be re-checked against that overlay in one place.

   Every base number below is v2's own, written literally and multiplied by
   --tab-scale (declared in views/overlay-layout.css, default 1). Resizing the
   stack is therefore one value there, and the provenance of each number stays
   readable here. Hairline radii and text outlines are deliberately NOT scaled:
   they are rendering detail, and a 1.2px outline only reads as blur. */
.champion-tab-shell {
  --s: var(--tab-scale, 1);

  --tab-size: calc(72px * var(--s));
  --rail-inset: calc(2px * var(--s));
  --rail-width: calc(23.34px * var(--s));
  --art-left: calc(25.34px * var(--s));
  --art-width: calc(46.66px * var(--s));
  --art-height: calc(48px * var(--s));
  --status-height: calc(24px * var(--s));

  width: var(--tab-size);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(2px * var(--s));
}

.champion-tab-shell.mirror {
  align-items: flex-end;
}

.name-label {
  height: calc(12px * var(--s));
  max-width: calc(12rem * var(--s));
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.name-text {
  font-size: calc(12px * var(--s));
  line-height: calc(12px * var(--s));
  font-weight: 700;
  color: #f7f7fa;
  white-space: nowrap;
  text-shadow:
    rgb(0 0 0 / 0.96) 0 1px 2px,
    rgb(0 0 0 / 0.72) 0 0 5px;
}

.champion-tab {
  position: relative;
  width: var(--tab-size);
  height: var(--tab-size);
  background-color: rgb(20 20 22 / 0.94);
  /* Square against the screen edge, rounded on the inward side. */
  border-radius: 0 2px 2px 0;
}

.champion-tab-shell.mirror .champion-tab {
  border-radius: 2px 0 0 2px;
}

/* Ability rail: summoner D, summoner F, keystone. */
.abilities {
  position: absolute;
  top: 0;
  left: var(--rail-inset);
  width: var(--rail-width);
  height: 100%;
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  gap: calc(1px * var(--s));
  padding: calc(1px * var(--s));
  background-color: rgb(10 10 12 / 0.97);
  border-radius: 2px;
}

.champion-tab-shell.mirror .abilities {
  left: auto;
  right: var(--rail-inset);
}

.ability {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  overflow: hidden;
}

.keystone img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.portrait {
  position: absolute;
  top: 0;
  left: var(--art-left);
  width: var(--art-width);
  height: var(--art-height);
  object-fit: cover;
  display: block;
}

.champion-tab-shell.mirror .portrait {
  left: auto;
  right: var(--art-left);
}

/* Level sits over the portrait's lower inner corner. */
.level {
  position: absolute;
  top: calc(24px * var(--s));
  left: calc(27px * var(--s));
  height: calc(24px * var(--s));
  display: flex;
  align-items: center;
  font-size: calc(14px * var(--s));
  font-weight: 700;
  color: #f7f7fa;
  /* Eight-way 1px outline plus a soft bloom — v2's treatment, so the number
     survives over a bright portrait. */
  text-shadow:
    rgb(0 0 0 / 0.92) 1px 1px 0,
    rgb(0 0 0 / 0.92) -1px 1px 0,
    rgb(0 0 0 / 0.92) 1px -1px 0,
    rgb(0 0 0 / 0.92) -1px -1px 0,
    rgb(0 0 0 / 0.92) 1px 0 0,
    rgb(0 0 0 / 0.92) -1px 0 0,
    rgb(0 0 0 / 0.92) 0 1px 0,
    rgb(0 0 0 / 0.92) 0 -1px 0,
    rgb(0 0 0 / 0.85) 0 0 4px;
  z-index: 2;
}

.champion-tab-shell.mirror .level {
  left: auto;
  right: calc(27px * var(--s));
}

/* Champion counter takes the portrait's opposite corner from the level. */
.stacks {
  position: absolute;
  top: calc(24px * var(--s));
  right: calc(2px * var(--s));
  height: calc(24px * var(--s));
  display: flex;
  align-items: center;
  font-size: calc(12px * var(--s));
  font-weight: 700;
  color: #f7f7fa;
  text-shadow:
    rgb(0 0 0 / 0.92) 1px 1px 0,
    rgb(0 0 0 / 0.92) -1px -1px 0,
    rgb(0 0 0 / 0.85) 0 0 4px;
  z-index: 2;
}

.champion-tab-shell.mirror .stacks {
  right: auto;
  left: calc(2px * var(--s));
}

.ultimate {
  position: absolute;
  top: calc(2px * var(--s));
  left: calc(60px * var(--s));
  width: calc(18px * var(--s));
  height: calc(18px * var(--s));
  border-radius: 2px;
  overflow: hidden;
  z-index: 4;
}

.champion-tab-shell.mirror .ultimate {
  left: auto;
  right: calc(60px * var(--s));
}

/* XP / health / resource, aligned under the portrait. */
.status {
  position: absolute;
  top: var(--art-height);
  left: var(--art-left);
  width: var(--art-width);
  height: var(--status-height);
  display: flex;
  flex-direction: column;
  gap: calc(1px * var(--s));
}

.champion-tab-shell.mirror .status {
  left: auto;
  right: var(--art-left);
}

.track {
  position: relative;
  width: 100%;
  background-color: rgb(0 0 0 / 0.45);
  border-radius: 1px;
  overflow: hidden;
}

.track-xp {
  height: calc(4.4px * var(--s));
}

.track-health,
.track-resource {
  height: calc(8.8px * var(--s));
}

.fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.3s ease-out;
}

/* Fills drain toward each team's own screen edge. */
.champion-tab-shell.mirror .fill {
  margin-left: auto;
}

.respawn {
  position: absolute;
  top: 0;
  left: var(--art-left);
  width: var(--art-width);
  height: var(--art-height);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(18px * var(--s));
  font-weight: 800;
  color: #f7f7fa;
  background: rgb(0 0 0 / 0.66);
  text-shadow: 0 0 3px rgb(0 0 0 / 0.9);
  z-index: 3;
}

.champion-tab-shell.mirror .respawn {
  left: auto;
  right: var(--art-left);
}

.champion-tab-shell.is-dead .portrait,
.champion-tab-shell.is-dead .abilities,
.champion-tab-shell.is-dead .ultimate {
  filter: grayscale(1);
  transition: filter 0.5s ease;
}
</style>
