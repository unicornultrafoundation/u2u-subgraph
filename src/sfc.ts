import { log } from "@graphprotocol/graph-ts"
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
import { Delegation, Delegator, Validation, Validator, WithdrawalRequest } from "../generated/schema"
import { EMPTY_STRING, ONE_BI, ZERO_BI, arrayContained, concatID, isEqual } from "./helper"
import { loadStaking, newDelegation, newDelegator, newValidation, newValidator, newWithdrawalRequest } from "./initialize"

function loadValidator(_id: string, _txHash: string): Validator | null {
  let val: Validator | null = Validator.load(_id)
  if (val == null) {
    log.error("something wrong with ID: {}", [_txHash])
    return null
  }
  return val
}

/**
 * Create new validator event handle
 * @param e 
 * @returns 
 */
export function handleCreatedValidator(e: CreatedValidator): void {
  log.info("Create validator handle with txHash: {}", [e.transaction.hash.toHexString()])
  let validator = Validator.load(e.params.validatorID.toHexString())
  if (validator != null) {
    log.error("validator already exists with ID: {}", [e.params.validatorID.toHexString()])
    return;
  }
  validator = newValidator(e.params.validatorID)
  validator.validatorId = e.params.validatorID
  validator.auth = e.params.auth
  validator.createdEpoch = e.params.createdEpoch
  validator.createdTime = e.params.createdTime
  validator.hash = e.transaction.hash

  // Count validator ccreation
  let staking = loadStaking()
  staking.totalValidator = staking.totalValidator.plus(ONE_BI)

  staking.save()
  validator.save()
}

/**
 * Delegated event handle
 * @param e 
 * @returns 
 */
export function handleDelegated(e: Delegated): void {
  log.info("Delegated handle with txHash: {}", [e.transaction.hash.toHexString()])

  let staking = loadStaking() // load staking 

  // Validation update
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString())
  let validation = Validation.load(_validationId)
  if (validation == null) {
    validation = newValidation(_validationId)
    validation.validatorId = e.params.toValidatorID.toHexString();
  }
  validation.stakedAmount = validation.stakedAmount.plus(e.params.amount)

  // Delegation table update
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    delegation = newDelegation(_delegationId)
    delegation.delegator = e.params.delegator.toHexString()
    delegation.validatorId = e.params.toValidatorID
  }
  delegation.stakedAmount = delegation.stakedAmount.plus(e.params.amount)

  // Delegator table update
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    delegator = newDelegator(e.params.delegator.toHexString())
    delegator.createdOn = e.block.timestamp
    delegator.address = e.params.delegator

    // Count new validator
    staking.totalDelegator = staking.totalDelegator.plus(ONE_BI)
  }
  delegator.stakedAmount = delegator.stakedAmount.plus(e.params.amount) // Increase staked amount

  let _delValidations = delegator.validations;
  if (!arrayContained(_delValidations,_validationId)) {
    _delValidations.push(_validationId)
  }
  delegator.validations = _delValidations

  // Validator update
  let validator = loadValidator(e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) return
  if (isEqual(validator.auth.toHexString(), e.params.delegator.toHexString())) {
    validator.selfStaked = validator.selfStaked.plus(e.params.amount)
    staking.totalSelfStaked = staking.totalSelfStaked.plus(e.params.amount)
  } else {
    validator.delegatedAmount = validator.delegatedAmount.plus(e.params.amount)
    staking.totalDelegated = staking.totalDelegated.plus(e.params.amount)
  }
  validator.totalStakedAmount = validator.totalStakedAmount.plus(e.params.amount)
  staking.totalStaked = staking.totalStaked.plus(e.params.amount)

  let _valDelegations = validator.delegations;
  if (!arrayContained(_valDelegations, _delegationId)) {
    _valDelegations.push(_delegationId)
  }
  validator.delegations = _valDelegations;


  // Save
  validation.save()
  delegation.save()
  validator.save()
  delegator.save()

  staking.save()
}

/**
 * Undelegated event handle
 * @param e 
 * @returns 
 */
export function handleUndelegated(e: Undelegated): void {
  log.info("Undelegated handle with txHash: {}", [e.transaction.hash.toString()])

  let staking = loadStaking() // load staking

  // Validation update
  let _validationId = concatID(e.params.delegator.toString(), e.params.toValidatorID.toString())
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("undelegated: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toString()])
    return
  }
  if (validation.stakedAmount < e.params.amount) {
    log.error("undelegated: unstaked amount too large, txHash: {}", [e.transaction.hash.toString()])
    return
  }
  validation.stakedAmount = validation.stakedAmount.minus(e.params.amount)
  // Delegator table
  let delegator = Delegator.load(e.params.delegator.toString())
  if (delegator == null) {
    log.error("undelegated: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toString(), e.transaction.hash.toString()])
    return
  }
  delegator.stakedAmount = delegator.stakedAmount.minus(e.params.amount)

  // Handle withdrawal request
  let _wrId = concatID(concatID(e.params.delegator.toString(), e.params.toValidatorID.toString()), e.params.wrID.toString())
  let withdrawalRequest = WithdrawalRequest.load(_wrId)
  if (withdrawalRequest == null) {
    withdrawalRequest = newWithdrawalRequest(_wrId)
    withdrawalRequest.delegatorAddress = e.params.delegator
    withdrawalRequest.validatorId = e.params.toValidatorID
  }
  withdrawalRequest.amount = withdrawalRequest.amount.plus(e.params.amount)
  withdrawalRequest.time = e.block.timestamp;
  // TODO: handle epoch
  // withdrawalRequest.epoch = 
  // Delegation table
  let _delegationId = concatID(e.params.toValidatorID.toString(), e.params.delegator.toString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("undelegated: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toString()])
    return
  }
  delegation.stakedAmount = delegation.stakedAmount.minus(e.params.amount)
  delegation.wr = _wrId

  // Validator update
  let validator = loadValidator(e.params.toValidatorID.toString(), e.transaction.hash.toString())
  if (validator == null) {
    log.error("undelegated: load validator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toString(), e.transaction.hash.toString()])
    return
  }
  if (isEqual(validator.auth.toString(), e.params.delegator.toString())) {
    validator.selfStaked = validator.selfStaked.minus(e.params.amount)
    staking.totalSelfStaked = staking.totalSelfStaked.minus(e.params.amount)
  } else {
    validator.delegatedAmount = validator.delegatedAmount.minus(e.params.amount)
    staking.totalDelegated = staking.totalDelegated.minus(e.params.amount)
  }
  validator.totalStakedAmount = validator.totalStakedAmount.minus(e.params.amount)
  staking.totalStaked = staking.totalStaked.minus(e.params.amount)

  // save
  withdrawalRequest.save()
  validation.save()
  delegator.save()
  delegation.save()
  validator.save()
}

/**
 * Withdrawn event handle
 * @param event 
 */
export function handleWithdrawn(e: Withdrawn): void {
  // Handle withdrawal request
  let _wrId = concatID(concatID(e.params.delegator.toString(), e.params.toValidatorID.toString()), e.params.wrID.toString())
  let withdrawalRequest = WithdrawalRequest.load(_wrId)
  if (withdrawalRequest == null) {
    log.error("withdraw: load wr failed with ID: {}, txHash: {}", [_wrId, e.transaction.hash.toString()])
    return
  }
  withdrawalRequest.amount = ZERO_BI
  // Delegation table
  let _delegationId = concatID(e.params.toValidatorID.toString(), e.params.delegator.toString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("undelegated: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toString()])
    return
  }
  delegation.wr = EMPTY_STRING
  // Save
  withdrawalRequest.save()
  delegation.save()
}

export function handleBurntFTM(event: BurntFTM): void {}

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
