import { Epoch, Validator } from "../generated/schema"
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
  epoch.epochRewards = ZERO_BI
  epoch.totalRewards = ZERO_BI
  epoch.validators = []
  return epoch
}

export function newValidator(_validator: string): Validator {
  let validator = new Validator(_validator)
  validator.receivedStake = ZERO_BI
  validator.accumulatedRewardPerToken = ZERO_BI
  validator.validatorId = ZERO_BI
  validator.epochId = ZERO_BI
  validator.epochRewards = ZERO_BI
  validator.totalRewards = ZERO_BI
  return validator
} 