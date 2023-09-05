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
import { BigInt } from "@graphprotocol/graph-ts";
import { Delegation, Delegator, LockedUp, Validation, Validator, WithdrawalRequest } from "../generated/schema"
import { EMPTY_STRING, ONE_BI, TransactionType, ZERO_BI, ZERO_BYTES, arrayContained, concatID, isEqual } from "./helper"
import { calVotingPower, loadStaking, newDelegation, newDelegator, newLockedUp, newTransaction, newValidation, newValidator, newWithdrawalRequest } from "./initialize"

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

  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.CreateValidator.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.CreateValidator)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.validatorID
  transaction.delegator = e.transaction.from
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.stakedAmount = e.transaction.value

  staking.save()
  validator.save()
  transaction.save()
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
    validation.validator = e.params.toValidatorID.toHexString();
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
  if (!arrayContained(_delValidations, _validationId)) {
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

  let _newTotalValStaked = validator.totalStakedAmount.plus(e.params.amount)
  let _newTotalStaked = staking.totalStaked.plus(e.params.amount)

  validator.totalStakedAmount = _newTotalValStaked
  staking.totalStaked = _newTotalStaked

  let _valDelegations = validator.delegations;
  if (!arrayContained(_valDelegations, _delegationId)) {
    _valDelegations.push(_delegationId)
  }
  validator.delegations = _valDelegations;
  validator.votingPower = calVotingPower(_newTotalValStaked, _newTotalStaked)

  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.Delegate.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.Delegate)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.toValidatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.stakedAmount = e.params.amount

  // Save
  validation.save()
  delegation.save()
  validator.save()
  delegator.save()
  staking.save()
  transaction.save()
}

/**
 * Undelegated event handle
 * @param e 
 * @returns 
 */
export function handleUndelegated(e: Undelegated): void {
  log.info("Undelegated handle with txHash: {}", [e.transaction.hash.toHexString()])

  let staking = loadStaking() // load staking

  // Validation update
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString())
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("undelegated: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toHexString()])
    return
  }
  if (validation.stakedAmount < e.params.amount) {
    log.error("undelegated: unstaked amount too large, txHash: {}", [e.transaction.hash.toHexString()])
    return
  }
  validation.stakedAmount = validation.stakedAmount.minus(e.params.amount)
  // Delegator load
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("undelegated: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegator.stakedAmount = delegator.stakedAmount.minus(e.params.amount)

  // Handle withdrawal request
  let _wrId = concatID(concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString()), e.params.wrID.toHexString())
  let withdrawalRequest = WithdrawalRequest.load(_wrId)
  if (withdrawalRequest == null) {
    withdrawalRequest = newWithdrawalRequest(_wrId)
    withdrawalRequest.delegatorAddress = e.params.delegator
    withdrawalRequest.validatorId = e.params.toValidatorID
    withdrawalRequest.wrID = e.params.wrID
  }
  withdrawalRequest.hash = e.transaction.hash
  withdrawalRequest.unbondingAmount = withdrawalRequest.unbondingAmount.plus(e.params.amount)
  withdrawalRequest.time = e.block.timestamp;
  // Delegation load
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("undelegated: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }
  delegation.stakedAmount = delegation.stakedAmount.minus(e.params.amount)
  delegation.wr = _wrId

  // Validator update
  let validator = loadValidator(e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) {
    log.error("undelegated: load validator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  if (isEqual(validator.auth.toHexString(), e.params.delegator.toHexString())) {
    validator.selfStaked = validator.selfStaked.minus(e.params.amount)
    staking.totalSelfStaked = staking.totalSelfStaked.minus(e.params.amount)
  } else {
    validator.delegatedAmount = validator.delegatedAmount.minus(e.params.amount)
    staking.totalDelegated = staking.totalDelegated.minus(e.params.amount)
  }
  let _newTotalValStaked = validator.totalStakedAmount.minus(e.params.amount)
  let _newTotalStaked = staking.totalStaked.minus(e.params.amount)
  validator.totalStakedAmount = _newTotalValStaked
  staking.totalStaked = _newTotalStaked
  validator.votingPower = calVotingPower(_newTotalValStaked, _newTotalStaked)

  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.Undelegate.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.Undelegate)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.toValidatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.undelegatedAmount = e.params.amount
  transaction.wrID = e.params.wrID

  // save
  withdrawalRequest.save()
  validation.save()
  delegator.save()
  delegation.save()
  validator.save()
  staking.save()
}

/**
 * Withdrawn event handle
 * @param event 
 */
export function handleWithdrawn(e: Withdrawn): void {
  log.info("Withdraw handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Handle withdrawal request
  let _wrId = concatID(concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString()), e.params.wrID.toHexString())
  let withdrawalRequest = WithdrawalRequest.load(_wrId)
  if (withdrawalRequest == null) {
    log.error("withdraw: load wr failed with ID: {}, txHash: {}", [_wrId, e.transaction.hash.toHexString()])
    return
  }
  withdrawalRequest.unbondingAmount = ZERO_BI
  // Delegation load
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("withdraw: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }
  delegation.wr = EMPTY_STRING

  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.Withdrawn.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.Withdrawn)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.toValidatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.wrID = e.params.wrID
  transaction.withdrawalAmount = e.params.amount
  // Save
  withdrawalRequest.save()
  delegation.save()
  transaction.save()
}

/**
 * Claimed rewards event handle
 * @param event 
 */
export function handleClaimedRewards(e: ClaimedRewards): void {
  log.info("Claimed rewards handle with txHash: {}", [e.transaction.hash.toHexString()])
  const _totalRewards = e.params.lockupBaseReward.plus(e.params.lockupExtraReward).plus(e.params.unlockedReward)
  // Delegator load
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("claimedRewards: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  let validator = Validator.load(e.params.toValidatorID.toHexString())
  if (validator == null) {
    log.error("claimedRewards: load validator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return;
  }

  // Delegation load
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("claimedRewards: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }

  let staking = loadStaking()
  delegator.totalClaimedRewards = delegator.totalClaimedRewards.plus(_totalRewards)
  validator.totalClaimedRewards = validator.totalClaimedRewards.plus(_totalRewards)
  staking.totalClaimedRewards = staking.totalClaimedRewards.plus(_totalRewards)
  delegation.totalClaimedRewards = delegation.totalClaimedRewards.plus(_totalRewards)


  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.ClaimRewards.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.ClaimRewards)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.toValidatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.claimedAmount = _totalRewards

  delegator.save()
  staking.save()
  validator.save()
  delegation.save()
  transaction.save()
}

/**
 * Handle restake rewards
 * @param e 
 */
export function handleRestakedRewards(e: RestakedRewards): void {
  log.info("Restake rewards handle with txHash: {}", [e.transaction.hash.toHexString()])
  const _totalRewards = e.params.lockupBaseReward.plus(e.params.lockupExtraReward).plus(e.params.unlockedReward)
  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.Restake.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.Restake)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.toValidatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.claimedAmount = _totalRewards
  transaction.stakedAmount = _totalRewards
  transaction.save()
}

/**
 * Handle lockedup stake
 * @param e 
 */
export function handleLockedUpStake(e: LockedUpStake): void {
  log.info("LockedUpStake handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Lockedup load
  let _lockedupId = concatID(e.params.delegator.toHexString(), e.params.validatorID.toHexString())
  let lockedup = LockedUp.load(_lockedupId)
  if (lockedup == null) {
    lockedup = newLockedUp(_lockedupId)
    lockedup.delegator = e.params.delegator.toHexString()
    lockedup.validator = e.params.validatorID.toHexString()
  }
  lockedup.duration = e.params.duration
  lockedup.lockedAmount = lockedup.lockedAmount.plus(e.params.amount)

  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.LockedUp.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.LockedUp)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.validatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.lockedAmount = e.params.amount
  transaction.lockDuration = e.params.duration

  lockedup.save()
  transaction.save()
}

/**
 * Handle unlocked stake event
 * @param e 
 */
export function handleUnlockedStake(e: UnlockedStake): void {
  log.info("UnlockedStake handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Lockedup load
  let _lockedupId = concatID(e.params.delegator.toHexString(), e.params.validatorID.toHexString())
  let lockedup = LockedUp.load(_lockedupId)
  if (lockedup == null) {
    log.error("unlockedStake: load lockedId failed with ID: {}, txHash: {}", [_lockedupId, e.transaction.hash.toHexString()])
    return;
  }
  lockedup.unlockedAmount = lockedup.unlockedAmount.plus(e.params.amount)
  lockedup.penalty = lockedup.penalty.plus(e.params.penalty)

  let _transactionId = concatID(e.transaction.hash.toHexString(), TransactionType.Unlocked.toString())
  let transaction = newTransaction(_transactionId)
  transaction.txHash = e.transaction.hash
  transaction.type = BigInt.fromI32(TransactionType.Unlocked)
  transaction.from = e.transaction.from
  transaction.to = e.transaction.to
  transaction.validatorId = e.params.validatorID
  transaction.delegator = e.params.delegator
  transaction.createdAt = e.block.timestamp
  transaction.block = e.block.number
  transaction.unlockedAmount = e.params.amount
  transaction.penaltyAmount = e.params.penalty

  transaction.save()
  lockedup.save()
}


export function handleBurntFTM(event: BurntFTM): void { }
export function handleInflatedFTM(event: InflatedFTM): void { }
export function handleRefundedSlashedLegacyDelegation(
  event: RefundedSlashedLegacyDelegation
): void { }
export function handleUpdatedSlashingRefundRatio(
  event: UpdatedSlashingRefundRatio
): void { }
