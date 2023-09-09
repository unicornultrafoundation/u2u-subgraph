import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  BurntFTM,
  ClaimedRewards,
  CreatedValidator,
  Delegated,
  InflatedFTM,
  LockedUpStake,
  RefundedSlashedLegacyDelegation,
  RestakedRewards,
  Undelegated,
  UnlockedStake,
  UpdatedSlashingRefundRatio,
  Withdrawn
} from "../generated/SFC/SFC"

export function createBurntFTMEvent(amount: BigInt): BurntFTM {
  let burntFtmEvent = changetype<BurntFTM>(newMockEvent())

  burntFtmEvent.parameters = new Array()

  burntFtmEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return burntFtmEvent
}

export function createClaimedRewardsEvent(
  delegator: Address,
  toValidatorID: BigInt,
  lockupExtraReward: BigInt,
  lockupBaseReward: BigInt,
  unlockedReward: BigInt
): ClaimedRewards {
  let claimedRewardsEvent = changetype<ClaimedRewards>(newMockEvent())

  claimedRewardsEvent.parameters = new Array()

  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "toValidatorID",
      ethereum.Value.fromUnsignedBigInt(toValidatorID)
    )
  )
  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "lockupExtraReward",
      ethereum.Value.fromUnsignedBigInt(lockupExtraReward)
    )
  )
  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "lockupBaseReward",
      ethereum.Value.fromUnsignedBigInt(lockupBaseReward)
    )
  )
  claimedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "unlockedReward",
      ethereum.Value.fromUnsignedBigInt(unlockedReward)
    )
  )

  return claimedRewardsEvent
}

export function createCreatedValidatorEvent(
  validatorID: BigInt,
  auth: Address,
  createdEpoch: BigInt,
  createdTime: BigInt
): CreatedValidator {
  let createdValidatorEvent = changetype<CreatedValidator>(newMockEvent())

  createdValidatorEvent.parameters = new Array()

  createdValidatorEvent.parameters.push(
    new ethereum.EventParam(
      "validatorID",
      ethereum.Value.fromUnsignedBigInt(validatorID)
    )
  )
  createdValidatorEvent.parameters.push(
    new ethereum.EventParam("auth", ethereum.Value.fromAddress(auth))
  )
  createdValidatorEvent.parameters.push(
    new ethereum.EventParam(
      "createdEpoch",
      ethereum.Value.fromUnsignedBigInt(createdEpoch)
    )
  )
  createdValidatorEvent.parameters.push(
    new ethereum.EventParam(
      "createdTime",
      ethereum.Value.fromUnsignedBigInt(createdTime)
    )
  )

  return createdValidatorEvent
}

export function createDelegatedEvent(
  delegator: Address,
  toValidatorID: BigInt,
  amount: BigInt
): Delegated {
  let delegatedEvent = changetype<Delegated>(newMockEvent())

  delegatedEvent.parameters = new Array()

  delegatedEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  delegatedEvent.parameters.push(
    new ethereum.EventParam(
      "toValidatorID",
      ethereum.Value.fromUnsignedBigInt(toValidatorID)
    )
  )
  delegatedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return delegatedEvent
}

export function createInflatedFTMEvent(
  receiver: Address,
  amount: BigInt,
  justification: string
): InflatedFTM {
  let inflatedFtmEvent = changetype<InflatedFTM>(newMockEvent())

  inflatedFtmEvent.parameters = new Array()

  inflatedFtmEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  inflatedFtmEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  inflatedFtmEvent.parameters.push(
    new ethereum.EventParam(
      "justification",
      ethereum.Value.fromString(justification)
    )
  )

  return inflatedFtmEvent
}

export function createLockedUpStakeEvent(
  delegator: Address,
  validatorID: BigInt,
  duration: BigInt,
  amount: BigInt
): LockedUpStake {
  let lockedUpStakeEvent = changetype<LockedUpStake>(newMockEvent())

  lockedUpStakeEvent.parameters = new Array()

  lockedUpStakeEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  lockedUpStakeEvent.parameters.push(
    new ethereum.EventParam(
      "validatorID",
      ethereum.Value.fromUnsignedBigInt(validatorID)
    )
  )
  lockedUpStakeEvent.parameters.push(
    new ethereum.EventParam(
      "duration",
      ethereum.Value.fromUnsignedBigInt(duration)
    )
  )
  lockedUpStakeEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return lockedUpStakeEvent
}

export function createRefundedSlashedLegacyDelegationEvent(
  delegator: Address,
  validatorID: BigInt,
  amount: BigInt
): RefundedSlashedLegacyDelegation {
  let refundedSlashedLegacyDelegationEvent = changetype<
    RefundedSlashedLegacyDelegation
  >(newMockEvent())

  refundedSlashedLegacyDelegationEvent.parameters = new Array()

  refundedSlashedLegacyDelegationEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  refundedSlashedLegacyDelegationEvent.parameters.push(
    new ethereum.EventParam(
      "validatorID",
      ethereum.Value.fromUnsignedBigInt(validatorID)
    )
  )
  refundedSlashedLegacyDelegationEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return refundedSlashedLegacyDelegationEvent
}

export function createRestakedRewardsEvent(
  delegator: Address,
  toValidatorID: BigInt,
  lockupExtraReward: BigInt,
  lockupBaseReward: BigInt,
  unlockedReward: BigInt
): RestakedRewards {
  let restakedRewardsEvent = changetype<RestakedRewards>(newMockEvent())

  restakedRewardsEvent.parameters = new Array()

  restakedRewardsEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  restakedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "toValidatorID",
      ethereum.Value.fromUnsignedBigInt(toValidatorID)
    )
  )
  restakedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "lockupExtraReward",
      ethereum.Value.fromUnsignedBigInt(lockupExtraReward)
    )
  )
  restakedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "lockupBaseReward",
      ethereum.Value.fromUnsignedBigInt(lockupBaseReward)
    )
  )
  restakedRewardsEvent.parameters.push(
    new ethereum.EventParam(
      "unlockedReward",
      ethereum.Value.fromUnsignedBigInt(unlockedReward)
    )
  )

  return restakedRewardsEvent
}

export function createUndelegatedEvent(
  delegator: Address,
  toValidatorID: BigInt,
  wrID: BigInt,
  amount: BigInt
): Undelegated {
  let undelegatedEvent = changetype<Undelegated>(newMockEvent())

  undelegatedEvent.parameters = new Array()

  undelegatedEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  undelegatedEvent.parameters.push(
    new ethereum.EventParam(
      "toValidatorID",
      ethereum.Value.fromUnsignedBigInt(toValidatorID)
    )
  )
  undelegatedEvent.parameters.push(
    new ethereum.EventParam("wrID", ethereum.Value.fromUnsignedBigInt(wrID))
  )
  undelegatedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return undelegatedEvent
}

export function createUnlockedStakeEvent(
  delegator: Address,
  validatorID: BigInt,
  amount: BigInt,
  penalty: BigInt
): UnlockedStake {
  let unlockedStakeEvent = changetype<UnlockedStake>(newMockEvent())

  unlockedStakeEvent.parameters = new Array()

  unlockedStakeEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  unlockedStakeEvent.parameters.push(
    new ethereum.EventParam(
      "validatorID",
      ethereum.Value.fromUnsignedBigInt(validatorID)
    )
  )
  unlockedStakeEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  unlockedStakeEvent.parameters.push(
    new ethereum.EventParam(
      "penalty",
      ethereum.Value.fromUnsignedBigInt(penalty)
    )
  )

  return unlockedStakeEvent
}

export function createUpdatedSlashingRefundRatioEvent(
  validatorID: BigInt,
  refundRatio: BigInt
): UpdatedSlashingRefundRatio {
  let updatedSlashingRefundRatioEvent = changetype<UpdatedSlashingRefundRatio>(
    newMockEvent()
  )

  updatedSlashingRefundRatioEvent.parameters = new Array()

  updatedSlashingRefundRatioEvent.parameters.push(
    new ethereum.EventParam(
      "validatorID",
      ethereum.Value.fromUnsignedBigInt(validatorID)
    )
  )
  updatedSlashingRefundRatioEvent.parameters.push(
    new ethereum.EventParam(
      "refundRatio",
      ethereum.Value.fromUnsignedBigInt(refundRatio)
    )
  )

  return updatedSlashingRefundRatioEvent
}

export function createWithdrawnEvent(
  delegator: Address,
  toValidatorID: BigInt,
  wrID: BigInt,
  amount: BigInt
): Withdrawn {
  let withdrawnEvent = changetype<Withdrawn>(newMockEvent())

  withdrawnEvent.parameters = new Array()

  withdrawnEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  withdrawnEvent.parameters.push(
    new ethereum.EventParam(
      "toValidatorID",
      ethereum.Value.fromUnsignedBigInt(toValidatorID)
    )
  )
  withdrawnEvent.parameters.push(
    new ethereum.EventParam("wrID", ethereum.Value.fromUnsignedBigInt(wrID))
  )
  withdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return withdrawnEvent
}
