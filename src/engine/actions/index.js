// Action router — maps actionId to the correct handler.

import { isBasicGain, executeBasicGain } from './basicActions.js';
import { yellowActionHandlers } from './yellowActions.js';
import { goldActionHandlers } from './goldActions.js';
import { whiteActionHandlers } from './whiteActions.js';
import { blackActionHandlers } from './blackActions.js';
import { silverActionHandlers } from './silverActions.js';
import { blueActionHandlers } from './blueActions.js';
import { purpleActionHandlers } from './purpleActions.js';
import { redActionHandlers } from './redActions.js';

/**
 * All complex action handlers, keyed by actionId.
 */
const actionHandlers = {
    // Yellow
    gain3yellow: yellowActionHandlers.gain3yellow,
    gain2yellow: yellowActionHandlers.gain2yellow,
    steal2Gems: yellowActionHandlers.steal2Gems,
    steal3Gems: yellowActionHandlers.steal3Gems,
    yellowHybrid1: yellowActionHandlers.yellowHybrid1,
    yellowHybrid2: yellowActionHandlers.yellowHybrid2,
    yellowSwapResources: yellowActionHandlers.yellowSwapResources,

    // Gold
    convert2AnyTo2Gold: goldActionHandlers.convert2AnyTo2Gold,
    convert1AnyTo1Gold: goldActionHandlers.convert1AnyTo1Gold,
    gain3goldSkip: goldActionHandlers.gain3goldSkip,
    convert3AnyTo3Gold: goldActionHandlers.convert3AnyTo3Gold,
    goldVPPerGold: goldActionHandlers.goldVPPerGold,

    // White
    gain3vp: whiteActionHandlers.gain3vp,
    gain2vp: whiteActionHandlers.gain2vp,
    spend1AnyFor2VP: whiteActionHandlers.spend1AnyFor2VP,
    spend2AnyFor3VP: whiteActionHandlers.spend2AnyFor3VP,
    lose1VPGain2Any: whiteActionHandlers.lose1VPGain2Any,
    lose2VPGain4Any: whiteActionHandlers.lose2VPGain4Any,
    gain5VPAnd5Any: whiteActionHandlers.gain5VPAnd5Any,

    // Black
    blackSteal1VP: blackActionHandlers.blackSteal1VP,
    blackSteal2Any: blackActionHandlers.blackSteal2Any,
    blackStealWorker: blackActionHandlers.blackStealWorker,
    blackAllLose2VP: blackActionHandlers.blackAllLose2VP,
    blackAllLose4VP: blackActionHandlers.blackAllLose4VP,

    // Silver
    silver4Others1: silverActionHandlers.silver4Others1,
    silver3Others1: silverActionHandlers.silver3Others1,
    silver2Plus1Others: silverActionHandlers.silver2Plus1Others,
    silver2VPBoth: silverActionHandlers.silver2VPBoth,
    silverTakeBack2: silverActionHandlers.silverTakeBack2,
    silver3Plus2Others1: silverActionHandlers.silver3Plus2Others1,
    silver8VPOthers3S: silverActionHandlers.silver8VPOthers3S,

    // Blue
    blueR1ShopBenefit: blueActionHandlers.blueR1ShopBenefit,
    blueReduceCosts: blueActionHandlers.blueReduceCosts,
    blueIncreaseCosts: blueActionHandlers.blueIncreaseCosts,
    blueToggleShops: blueActionHandlers.blueToggleShops,
    blueAnyShopBenefit: blueActionHandlers.blueAnyShopBenefit,

    // Purple
    gain4purpleSkip: purpleActionHandlers.gain4purpleSkip,
    gain2purpleTakeBack: purpleActionHandlers.gain2purpleTakeBack,
    playTwoWorkers: purpleActionHandlers.playTwoWorkers,
    gain5purpleSkip: purpleActionHandlers.gain5purpleSkip,
    playThreeWorkers: purpleActionHandlers.playThreeWorkers,
    gain4purpleWaitAll: purpleActionHandlers.gain4purpleWaitAll,

    // Red
    redRepeatAction: redActionHandlers.redRepeatAction,
    redHybrid1: redActionHandlers.redHybrid1,
    redHybrid2: redActionHandlers.redHybrid2,
    redVPFocus: redActionHandlers.redVPFocus,
    redRepeatAll: redActionHandlers.redRepeatAll
};

/**
 * Route an action to the correct handler.
 * @returns {{ state, log, pendingDecision?, executeAction?, executeActions? }}
 */
export function routeAction(state, playerId, actionId, gameLayers, decisions, recursionDepth = 0) {
    // Check basic gains first (fast path)
    if (isBasicGain(actionId)) {
        return executeBasicGain(state, playerId, actionId, gameLayers, recursionDepth);
    }

    // Look up complex handler
    const handler = actionHandlers[actionId];
    if (!handler) {
        return {
            state,
            log: [`Unknown action: ${actionId}`]
        };
    }

    return handler(state, playerId, gameLayers, decisions, recursionDepth);
}

export { isBasicGain };
