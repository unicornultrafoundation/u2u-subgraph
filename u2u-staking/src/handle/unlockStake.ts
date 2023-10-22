import { log, BigInt } from "@graphprotocol/graph-ts";
import { UnlockedStake } from "../../generated/SFC/SFC";
import { ONE_BI, TransactionType, concatID } from "../helper";
import { Delegator, LockedUp, TransactionCount, Validation } from "../../generated/schema";
import { loadStaking, loadValidator, newTransaction, newTransactionCount } from "../initialize";

/**
 * Handle unlocked stake event
 * @param e 
 */
export function unlockStake(e: UnlockedStake): void {
  log.info("UnlockedStake handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Lockedup load
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.validatorID.toHexString())
  let _lockedupId = concatID(e.params.validatorID.toHexString(), e.params.delegator.toHexString())
  let staking = loadStaking() // load staking
  staking.totalLockStake = staking.totalLockStake.minus(e.params.amount)
  staking.save()
  lockedupUpdate(e, _lockedupId)
  transactionUpdate(e)
  validationUpdate(e, _validationId)
  validatorUpdate(e)
  delegatorUpdate(e)
}

function delegatorUpdate(e: UnlockedStake): void {
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("unlockedStake: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegator.totalLockStake = delegator.totalLockStake.minus(e.params.amount)
  delegator.save()
}

function validatorUpdate(e: UnlockedStake): void {
  let validator = loadValidator(e.params.validatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) {
    log.error("unlockedStake: load validator failed with ID: {}, txHash: {}", [e.params.validatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  validator.totalLockStake = validator.totalLockStake.minus(e.params.amount)
  validator.save()
}

function validationUpdate(e: UnlockedStake, _validationId: string): void {
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("unlockedStake: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toHexString()])
    return
  }
  validation.totalLockStake = validation.totalLockStake.minus(e.params.amount)
  validation.save()
}


function lockedupUpdate (e: UnlockedStake, _lockedupId: string): void {
  // Lockedup load
  let lockedup = LockedUp.load(_lockedupId)
  if (lockedup == null) {
    log.error("unlockedStake: load lockedId failed with ID: {}, txHash: {}", [_lockedupId, e.transaction.hash.toHexString()])
    return;
  }
  lockedup.unlockedAmount = lockedup.unlockedAmount.plus(e.params.amount)
  lockedup.lockedAmount = lockedup.lockedAmount.minus(e.params.amount)
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
  txCount.count.plus(ONE_BI)
  txCount.save()
}