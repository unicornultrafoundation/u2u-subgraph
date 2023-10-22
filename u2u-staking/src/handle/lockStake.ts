import { log, BigInt } from "@graphprotocol/graph-ts"
import { LockedUpStake } from "../../generated/SFC/SFC"
import { ONE_BI, TransactionType, concatID } from "../helper"
import { Delegation, Delegator, LockedUp, TransactionCount, Validation } from "../../generated/schema"
import { loadStaking, loadValidator, newLockedUp, newTransaction, newTransactionCount } from "../initialize"

/**
 * Handle lockedup stake
 * @param e 
 */
export function lockUpStake(e: LockedUpStake): void {
  log.info("LockedUpStake handle with txHash: {}", [e.transaction.hash.toHexString()])
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.validatorID.toHexString())
  let _lockedupId = concatID(e.params.validatorID.toHexString(), e.params.delegator.toHexString())
  let _delegationId = concatID(e.params.validatorID.toHexString(), e.params.delegator.toHexString())
  let staking = loadStaking() // load staking
  staking.totalLockStake = staking.totalLockStake.plus(e.params.amount)
  staking.save()
  transactionUpdate(e);
  lockedupUpdate(e, _lockedupId)
  validationUpdate(e, _validationId)
  delegationUpdate(e, _delegationId, _lockedupId)
  validatorUpdate(e)
  delegatorUpdate(e)
}

function delegatorUpdate(e: LockedUpStake): void {
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("LockedUpStake: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegator.totalLockStake = delegator.totalLockStake.plus(e.params.amount)
  delegator.save()
}

function validatorUpdate(e: LockedUpStake): void {
  let validator = loadValidator(e.params.validatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) {
    log.error("LockedUpStake: load validator failed with ID: {}, txHash: {}", [e.params.validatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  validator.totalLockStake = validator.totalLockStake.plus(e.params.amount)
  validator.save()
}

function delegationUpdate(e: LockedUpStake, _delegationId: string, _lockedupId: string): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("LockedUpStake: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }
  delegation.lockedUp = _lockedupId
  delegation.save()
}

function validationUpdate(e: LockedUpStake, _validationId: string): void {
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("LockedUpStake: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toHexString()])
    return
  }
  validation.totalLockStake = validation.totalLockStake.plus(e.params.amount)
  validation.save()
}


function lockedupUpdate (e: LockedUpStake, _lockedupId: string): void {
   // Lockedup load
   let lockedup = LockedUp.load(_lockedupId)
   if (lockedup == null) {
     lockedup = newLockedUp(_lockedupId)
     lockedup.delegator = e.params.delegator.toHexString()
     lockedup.validator = e.params.validatorID.toHexString()
   }
   lockedup.duration = e.params.duration
   lockedup.lockedAmount = lockedup.lockedAmount.plus(e.params.amount)
   lockedup.endTime = e.params.duration.plus(e.block.timestamp)

   lockedup.save()
}

function transactionUpdate(e: LockedUpStake): void {
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
  transaction.save()

  let txCount = TransactionCount.load(e.transaction.from.toString())
  if (txCount === null) {
    txCount = newTransactionCount(e.transaction.from.toString())
  }
  txCount.count.plus(ONE_BI)
  txCount.save()
}