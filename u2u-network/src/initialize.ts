import { Epoch } from "../generated/schema"
import { ZERO_BI } from "./helper"

/**
 * Initialize new Epoch entity
 * @param _epochId 
 */
export function newEpoch(_epochId: string): Epoch {
  let epoch = new Epoch(_epochId)
  epoch.epoch = ZERO_BI
  epoch.block = ZERO_BI
  epoch.endTime = ZERO_BI
  epoch.totalBaseReward = ZERO_BI
  epoch.totalTxReward = ZERO_BI
  epoch.totalStake = ZERO_BI
  epoch.totalSupply = ZERO_BI
  epoch.rewardPerSecond = ZERO_BI
  epoch.epochFee = ZERO_BI
  return epoch
}
