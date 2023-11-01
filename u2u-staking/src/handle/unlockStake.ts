import { log, BigInt } from "@graphprotocol/graph-ts";
import { UnlockedStake } from "../../generated/SFC/SFC";
import { ONE_BI, TransactionType, ZERO_BI, concatID, isEqual } from "../helper";
import { Delegation, Delegator, LockedUp, TransactionCount, Validation } from "../../generated/schema";
import { loadStaking, loadValidator, newTransaction, newTransactionCount } from "../initialize";
import { stashRewards } from "./stashRewards";

/**
 * Handle unlocked stake event
 * @param e 
 */
export function unlockStake(e: UnlockedStake): void {
  log.info("UnlockedStake handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Lockedup load
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.validatorID.toHexString())
  let _lockedupId = concatID(e.params.validatorID.toHexString(), e.params.delegator.toHexString())
  let _validatorId = e.params.validatorID.toHexString()
  let _delegatorId = e.params.delegator.toHexString()
  let _delegationId = concatID(e.params.validatorID.toHexString(), e.params.delegator.toHexString())

  //Handle Stash reward
  stashRewards(
    e.params.delegator,
    e.params.validatorID,
    _lockedupId,
    _validationId,
    _validatorId,
    _delegatorId
  )

  let staking = loadStaking() // load staking
  if (staking.totalLockStake.gt(e.params.amount)) {
    staking.totalLockStake = staking.totalLockStake.minus(e.params.amount)
  } else {
    staking.totalLockStake = ZERO_BI
  }
  staking.save()
  lockedupUpdate(e, _lockedupId)
  transactionUpdate(e)
  validationUpdate(e, _validationId)
  validatorUpdate(e)
  delegatorUpdate(e)
  delegationUpdate(e, _delegationId)
}

function delegatorUpdate(e: UnlockedStake): void {
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("unlockedStake: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  if (delegator.totalLockStake.gt(e.params.amount)) {
    delegator.totalLockStake = delegator.totalLockStake.minus(e.params.amount)
  } else {
    delegator.totalLockStake = ZERO_BI
  }
  delegator.stakedAmount = delegator.stakedAmount.minus(e.params.penalty)
  delegator.save()
}

function validatorUpdate(e: UnlockedStake): void {
  let staking = loadStaking() // load staking
  let validator = loadValidator(e.params.validatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) {
    log.error("unlockedStake: load validator failed with ID: {}, txHash: {}", [e.params.validatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  // Handle penalty amount
  if (isEqual(validator.auth.toHexString(), e.params.delegator.toHexString())) {
    validator.selfStaked = validator.selfStaked.minus(e.params.penalty)
    staking.totalSelfStaked = staking.totalSelfStaked.minus(e.params.penalty)
  } else {
    validator.delegatedAmount = validator.delegatedAmount.minus(e.params.penalty)
    staking.totalDelegated = staking.totalDelegated.minus(e.params.penalty)
  }
  let _newTotalValStaked = validator.totalStakedAmount.minus(e.params.penalty)
  let _newTotalStaked = staking.totalStaked.minus(e.params.penalty)
  validator.totalStakedAmount = _newTotalValStaked
  staking.totalStaked = _newTotalStaked
  // total lock
  if (validator.totalLockStake.gt(e.params.amount)) {
    validator.totalLockStake = validator.totalLockStake.minus(e.params.amount)
  } else {
    validator.totalLockStake = ZERO_BI
  }
  validator.save()
  staking.save()
}

function delegationUpdate(e: UnlockedStake, _delegationId: string): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("unlockedStake: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }
  // Handle penalty amount unstake
  delegation.stakedAmount = delegation.stakedAmount.minus(e.params.penalty)
  delegation.save()
}

function validationUpdate(e: UnlockedStake, _validationId: string): void {
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("unlockedStake: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toHexString()])
    return
  }
  if (validation.totalLockStake.gt(e.params.amount)) {
    validation.totalLockStake = validation.totalLockStake.minus(e.params.amount)
  } else {
    validation.totalLockStake = ZERO_BI
  }
  // Handle penalty unstake
  validation.stakedAmount = validation.stakedAmount.minus(e.params.penalty)
  validation.save()
}


function lockedupUpdate(e: UnlockedStake, _lockedupId: string): void {
  // Lockedup load
  let lockedup = LockedUp.load(_lockedupId)
  if (lockedup == null) {
    log.error("unlockedStake: load lockedId failed with ID: {}, txHash: {}", [_lockedupId, e.transaction.hash.toHexString()])
    return;
  }
  if (lockedup.lockedAmount.gt(e.params.amount)) {
    lockedup.lockedAmount = lockedup.lockedAmount.minus(e.params.amount)
  } else {
    lockedup.lockedAmount = ZERO_BI
  }
  lockedup.penalty = lockedup.penalty.plus(e.params.penalty)
  lockedup.save()
}

function transactionUpdate(e: UnlockedStake): void {
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

  let txCount = TransactionCount.load(e.transaction.from.toHexString())
  if (txCount === null) {
    txCount = newTransactionCount(e.transaction.from.toHexString())
  }
  txCount.count = txCount.count.plus(ONE_BI)
  txCount.save()
}