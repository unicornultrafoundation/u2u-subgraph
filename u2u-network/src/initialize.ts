import { Epoch, EpochCounter, Pointer, Validator, ValidatorCounter } from "../generated/schema"
import { EMPTY_STRING, ONE_BI, ZERO_BI } from "./helper"

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
  epoch.totalEpochFee = ZERO_BI
  epoch.validators = []
  return epoch
}

export function newValidator(_validator: string): Validator {
  let validator = new Validator(_validator)
  validator.receivedStake = ZERO_BI
  validator.accumulatedRewardPerToken = ZERO_BI
  validator.validatorId = ZERO_BI
  validator.epoch = EMPTY_STRING
  validator.epochRewards = ZERO_BI
  validator.totalRewards = ZERO_BI
  return validator
} 

export function loadEpochCounter(): EpochCounter {
  let _id = ONE_BI.toHexString()
  let counter = EpochCounter.load(_id)
  if (counter == null) {
    counter = new EpochCounter(_id)
    counter.total = ZERO_BI
  }
  return counter
}

export function loadValidatorCounter(_id: string): ValidatorCounter {
  let counter = ValidatorCounter.load(_id)
  if (counter == null) {
    counter = new ValidatorCounter(_id)
    counter.total = ZERO_BI
  }
  return counter
}


export function loadPointer(): Pointer {
  let _id = ONE_BI.toHexString()
  let _pointer = Pointer.load(_id)
  if (_pointer == null) {
    _pointer = new Pointer(_id)
    _pointer.pointer = ZERO_BI
  }
  return _pointer
}
