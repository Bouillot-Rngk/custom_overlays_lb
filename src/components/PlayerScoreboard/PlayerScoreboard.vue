<script setup lang="ts">
import { playerUpdateEvent } from '@bluebottle_gg/league-broadcast-client'
import { useIngameSelector } from '@/composables/useIngame'
import PlayerInfo from './PlayerInfo.vue'
import GoldDiff from './GoldDiff.vue'
import ItemBuyNotification from './ItemBuyNotification.vue'
import { useClient } from '@/client'
import { onUnmounted } from 'vue'
import { useNotificationQueue } from '@/composables/useNotificationQueue'
import SlideTransition from '@/transitions/SlideTransition.vue'

const scoreboard = useIngameSelector((s) => s.gameData.scoreboardBottom)
const tabs = useIngameSelector((s) => s.gameData.tabs)
const client = useClient()

const levelUpQueue = useNotificationQueue(2000)
const itemBuyQueue = useNotificationQueue(4000)

/**
 * Find which row index (0-4) and team a player belongs to,
 * based on their name matching scoreboard data.
 */
function findPlayerPosition(
  playerName: string,
): { playerIndex: number; team: 'Order' | 'Chaos' } | null {
  if (!scoreboard.value) return null
  for (let i = 0; i < 5; i++) {
    if (scoreboard.value.teams[0]?.players[i]?.name === playerName) {
      return { playerIndex: i, team: 'Order' }
    }
    if (scoreboard.value.teams[1]?.players[i]?.name === playerName) {
      return { playerIndex: i, team: 'Chaos' }
    }
  }
  return null
}
const minItemValue = 1800
const unsub = client.onIngameEvents({
  onPlayerEvent(event: playerUpdateEvent) {
    const pos = findPlayerPosition(event.playerNameAndTagLine)
    if (!pos) return

    // Queue level-up notifications
    if (event.levelUp) {
      levelUpQueue.enqueue({
        type: 'level-up',
        playerIndex: pos.playerIndex,
        team: pos.team,
        level: event.levelUp[1], // new level after the level-up
      })
    }

    // Queue item-buy notifications
    if (event.boughtItems) {
      for (const item of event.boughtItems) {
        if (item.cost < minItemValue) continue
        itemBuyQueue.enqueue({
          type: 'item-buy',
          playerIndex: pos.playerIndex,
          team: pos.team,
          itemIcon: client.getCacheUrl(item.assetUrl),
          itemName: item.displayName,
        })
      }
    }
  },
})

onUnmounted(() => {
  unsub()
})
</script>

<template>
  <!-- The shared slide, not a hand-rolled `<Transition name="slide-down">`.
       SlideTransition's style block is GLOBAL and matches any name containing
       "slide-", so a local rule of equal specificity loses to it on order: the
       board was entering from above (that rule's `0, -100%` default) however
       the local CSS was written. Declaring the direction through the component
       is the only way to control it. -->
  <SlideTransition enter-from="down" leave-to="down" :duration="420">
    <!-- `tabs` is passed through where a row wants it but is NOT required:
         requiring it meant hiding the champion tabs also blanked this row. -->
    <div id="player-scoreboard" v-if="scoreboard">
      <div v-for="i in 5" :key="i" class="scoreboard-row">
        <PlayerInfo
          :scoreboard-player="scoreboard?.teams[0]?.players[i - 1]"
          :tab-player="tabs?.['Order']?.players[i - 1]"
          :level-up-level="levelUpQueue.getActive('Order', i - 1)?.level"
          :level-up-visible="levelUpQueue.isVisible('Order', i - 1)"
          :level-up-exiting="levelUpQueue.isExiting('Order', i - 1)"
        />
        <GoldDiff
          :order-gold="scoreboard?.teams[0]?.players[i - 1]?.totalGold ?? 0"
          :chaos-gold="scoreboard?.teams[1]?.players[i - 1]?.totalGold ?? 0"
        />
        <PlayerInfo
          :scoreboard-player="scoreboard?.teams[1]?.players[i - 1]"
          :tab-player="tabs?.['Chaos']?.players[i - 1]"
          mirror
          :level-up-level="levelUpQueue.getActive('Chaos', i - 1)?.level"
          :level-up-visible="levelUpQueue.isVisible('Chaos', i - 1)"
          :level-up-exiting="levelUpQueue.isExiting('Chaos', i - 1)"
        />

        <!-- One item-buy plate per side, over that side's whole player block. -->
        <ItemBuyNotification
          v-if="itemBuyQueue.getActive('Order', i - 1)"
          class="item-buy-plate"
          :item-icon="itemBuyQueue.getActive('Order', i - 1)?.itemIcon"
          :item-name="itemBuyQueue.getActive('Order', i - 1)?.itemName"
          :visible="itemBuyQueue.isVisible('Order', i - 1)"
          :exiting="itemBuyQueue.isExiting('Order', i - 1)"
        />
        <ItemBuyNotification
          v-if="itemBuyQueue.getActive('Chaos', i - 1)"
          class="item-buy-plate"
          :item-icon="itemBuyQueue.getActive('Chaos', i - 1)?.itemIcon"
          :item-name="itemBuyQueue.getActive('Chaos', i - 1)?.itemName"
          :visible="itemBuyQueue.isVisible('Chaos', i - 1)"
          :exiting="itemBuyQueue.isExiting('Chaos', i - 1)"
          mirror
        />
      </div>
    </div>
  </SlideTransition>
</template>

<style lang="css" scoped>
/* A replica of LeagueBroadcast's own /ingame/v2 `.player-scoreboard`.
   v2 sizes this in viewport units (43vw x 23.2vh); the equivalent pixels at
   the overlay's fixed 1920x1080 canvas are used instead so the board cannot
   be resized by a browser window that is not exactly the canvas size.
   Placement (bottom-centre) lives in views/overlay-layout.css. */
#player-scoreboard {
  /* Brand mono throughout, synthesis off — see PlayerTab for the reasoning.
     Inherited by every row component below. */
  font-family: var(--brand-font-body);
  font-synthesis: none;

  display: flex;
  flex-direction: column;
  gap: 2px;
  /* Size deliberately omitted: overlay-layout.css owns placement, and a
     width/height here ties its specificity and silently wins. */
  background: var(--lb-surface-strong);
  border: 1px solid var(--lb-border-strong);
  /* Flush to the bottom of the frame, so it carries no bottom border. */
  border-bottom: 0;
  border-radius: var(--lb-radius-panel) var(--lb-radius-panel) 0 0;
  box-shadow: 0 -4px 24px rgb(0 0 0 / 0.64);
  overflow: hidden;
}

/* Blue block | gold column | red block, with no gap: the 2px separation the
   eye reads comes from the gaps inside each player block. */
.scoreboard-row {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 51.19px minmax(0, 1fr);
}

/* Covers one side's player block. Two classes so this beats the component's own scoped width, which is still
   sized to the pre-v2 grid. The mirrored side pins itself to the right. */
.scoreboard-row .item-buy-plate {
  width: calc((100% - 51.19px) / 2);
}
</style>
