import { Block, Epoch, Network, Validator } from "../generated/schema"
import { ONE_BI, ZERO_BI } from "./helper"

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
  epoch.epochBurntFees = ZERO_BI
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

export function newBlock(_blockId: string): Block {
  let block = new Block(_blockId)
  block.epoch = ZERO_BI
  block.blockNumber = ZERO_BI
  block.gasUsed = ZERO_BI
  block.baseFeePerGas = ZERO_BI
  block.timestamp = ZERO_BI
  block.burntFees = ZERO_BI
  block.totalBurntFees = ZERO_BI
  return block
} 

/**
 * load network entity
 * @returns 
 */
export function loadNetwork(): Network {
  let _id = ONE_BI.toHexString()
  let network = Network.load(_id)
  if (network == null) {
    network = new Network(_id)
    network.lastBlock = ZERO_BI
    network.lastEpoch = ZERO_BI
    network.totalBurntFees = ZERO_BI
    network.totalRewards = ZERO_BI
    network.lastEpochEndTime = ZERO_BI
    network.lastEpochBlock = ZERO_BI
  }
  return network
}
