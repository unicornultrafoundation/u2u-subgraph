import { BigInt, log } from "@graphprotocol/graph-ts"
import {
  SFC,
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
import { Delegator, Validator } from "../generated/schema"

function loadValidator (_id: string, _txHash: string): Validator | null {
  let val: Validator | null = Validator.load(_id)
  if (val == null) {
    log.error("something wrong with ID: {}", [_txHash])
    return null
  }
  return val
}

export function handleCreatedValidator(e: CreatedValidator): void {
  let valEntity = new Validator(e.params.validatorID.toString())
  valEntity.validatorId = e.params.validatorID
  valEntity.auth = e.params.auth
  valEntity.createdEpoch = e.params.createdEpoch
  valEntity.createdTime = e.params.createdTime
  valEntity.hash = e.transaction.hash
  valEntity.save()
}

export function handleDelegated(e: Delegated): void {
  log.info("Delegated handle with txHash: {}", [e.transaction.hash.toString()])
  let del = Delegator.load(e.params.delegator.toString())
  if (del == null) {
    del = new Delegator(e.params.delegator.toString())
  }
  let val = loadValidator(e.params.toValidatorID.toString(), e.transaction.hash.toString())
  if (val == null) return
  val.totalStakedAmount = val.totalStakedAmount.plus(e.params.amount)
  val.save()
}


export function handleUndelegated(e: Undelegated): void {
  let del = Delegator.load(e.params.delegator.toString())
  if (del == null) {
    log.error("something wrong with ID: {}", [e.params.delegator.toString()])
  }
  // TODO: logic handler
}


export function handleBurntFTM(event: BurntFTM): void {
  
}

export function handleClaimedRewards(event: ClaimedRewards): void {}



export function handleInflatedFTM(event: InflatedFTM): void {}

export function handleLockedUpStake(event: LockedUpStake): void {}

export function handleRefundedSlashedLegacyDelegation(
  event: RefundedSlashedLegacyDelegation
): void {}

export function handleRestakedRewards(event: RestakedRewards): void {}


export function handleUnlockedStake(event: UnlockedStake): void {}

export function handleUpdatedSlashingRefundRatio(
  event: UpdatedSlashingRefundRatio
): void {}

export function handleWithdrawn(event: Withdrawn): void {}
