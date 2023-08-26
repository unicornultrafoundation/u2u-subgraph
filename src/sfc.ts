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
import { Delegation, Delegator, Validation, Validator } from "../generated/schema"
import { concatID, isEqual } from "./helper"

function loadValidator(_id: string, _txHash: string): Validator | null {
  let val: Validator | null = Validator.load(_id)
  if (val == null) {
    log.error("something wrong with ID: {}", [_txHash])
    return null
  }
  return val
}

export function handleCreatedValidator(e: CreatedValidator): void {
  log.info("Create validator handle with txHash: {}", [e.transaction.hash.toString()])
  let validator = Validator.load(e.params.validatorID.toString())
  if (validator != null) {
    log.error("validator already exists with ID: {}", [e.params.validatorID.toString()])
    return;
  }
  validator = new Validator(e.params.validatorID.toString())
  validator.validatorId = e.params.validatorID
  validator.auth = e.params.auth
  validator.createdEpoch = e.params.createdEpoch
  validator.createdTime = e.params.createdTime
  validator.hash = e.transaction.hash
  validator.save()
}

export function handleDelegated(e: Delegated): void {
  log.info("Delegated handle with txHash: {}", [e.transaction.hash.toString()])

  // Validation update
  let _validationId = concatID(e.params.delegator.toString(), e.params.toValidatorID.toString())
  let validation = Validation.load(_validationId)
  if (validation == null) {
    validation = new Validation(_validationId)
    validation.validator = e.params.toValidatorID.toString();
  }
  validation.stakedAmount = validation.stakedAmount.plus(e.params.amount)

  // Delegation table update
  let _delegationId = concatID(e.params.toValidatorID.toString(), e.params.delegator.toString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    delegation = new Delegation(_delegationId)
    delegation.delegator = e.params.delegator.toString()
    delegation.validatorId = e.params.toValidatorID
  }
  delegation.stakedAmount = delegation.stakedAmount.plus(e.params.amount)

  // Delegator table update
  let delegator = Delegator.load(e.params.delegator.toString())
  if (delegator == null) {
    delegator = new Delegator(e.params.delegator.toString())
    delegator.createdOn = e.block.timestamp
    delegator.address = e.params.delegator
  }
  delegator.stakedAmount = delegator.stakedAmount.plus(e.params.amount) // Increase staked amount
  if (!delegator.validations || delegator.validations.indexOf(e.params.toValidatorID.toString()) == -1) {
    delegator.validations?.push(e.params.toValidatorID.toString())
  }

  // Validator update
  let validator = loadValidator(e.params.toValidatorID.toString(), e.transaction.hash.toString())
  if (validator == null) return
  if (isEqual(validator.auth.toString(), e.params.delegator.toString())) {
    validator.selfStaked = validator.selfStaked.plus(e.params.amount)
  } else {
    validator.delegatedAmount = validator.delegatedAmount.plus(e.params.amount)
  }
  validator.totalStakedAmount = validator.totalStakedAmount.plus(e.params.amount)
  if (!validator.delegations || validator.delegations.indexOf(_delegationId) == -1) {
    validator.delegations?.push(_delegationId)
  }
  validation.save()
  validator.save()
  delegator.save()
  delegation.save()
}

export function handleUndelegated(e: Undelegated): void {

}


export function handleBurntFTM(event: BurntFTM): void {

}

export function handleClaimedRewards(event: ClaimedRewards): void { }



export function handleInflatedFTM(event: InflatedFTM): void { }

export function handleLockedUpStake(event: LockedUpStake): void { }

export function handleRefundedSlashedLegacyDelegation(
  event: RefundedSlashedLegacyDelegation
): void { }

export function handleRestakedRewards(event: RestakedRewards): void { }


export function handleUnlockedStake(event: UnlockedStake): void { }

export function handleUpdatedSlashingRefundRatio(
  event: UpdatedSlashingRefundRatio
): void { }

export function handleWithdrawn(event: Withdrawn): void { }
