import { log, BigInt } from "@graphprotocol/graph-ts"
import { RestakedRewards } from "../../generated/SFC/SFC"
import { ONE_BI, TransactionType, concatID } from "../helper"
import { loadStaking, loadValidator, newLockedUp, newTransaction, newTransactionCount } from "../initialize"
import { Delegation, Delegator, LockedUp, TransactionCount, Validation } from "../../generated/schema"

/**
 * Handle restake rewards
 * @param e 
 */
export function restakRewards(e: RestakedRewards): void {
  log.info("Restake rewards handle with txHash: {}", [e.transaction.hash.toHexString()])
  let _lockedupId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  const _totalRewards = e.params.lockupBaseReward.plus(e.params.lockupExtraReward).plus(e.params.unlockedReward)
  const _lockupReward = e.params.lockupBaseReward.plus(e.params.lockupExtraReward)
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString())
  transactionUpdate(e, _totalRewards, _lockupReward)
  delegationUpdate(e, _delegationId, _totalRewards, _lockedupId)
  validatorUpdate(e, _totalRewards, _lockupReward)
  delegatorUpdate(e, _totalRewards, _lockupReward)
  lockedupUpdate(e, _lockedupId, _lockupReward)
  validationUpdate(e, _validationId, _lockupReward)
}

function lockedupUpdate (e: RestakedRewards, _lockedupId: string, _lockupReward: BigInt): void {
  // Lockedup load
  let lockedup = LockedUp.load(_lockedupId)
  if (lockedup == null) {
    lockedup = newLockedUp(_lockedupId)
    lockedup.delegator = e.params.delegator.toHexString()
    lockedup.validator = e.params.toValidatorID.toHexString()
  }
  lockedup.lockedAmount = lockedup.lockedAmount.plus(_lockupReward)
  lockedup.save()
}

function validationUpdate(e: RestakedRewards, _validationId: string, _lockupReward: BigInt): void {
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("Restake: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toHexString()])
    return
  }
  validation.totalLockStake = validation.totalLockStake.plus(_lockupReward)
  validation.save()
}

function delegatorUpdate(e: RestakedRewards, totalRewards: BigInt, _lockupReward: BigInt): void {
  // Delegator table update
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("Restake rewards: load delegator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegator.totalClaimedRewards =  delegator.totalClaimedRewards.plus(totalRewards)
  delegator.totalLockStake = delegator.totalLockStake.plus(_lockupReward)
  delegator.save()
}


function validatorUpdate(e: RestakedRewards, totalRewards: BigInt, _lockupReward: BigInt): void {
  let staking = loadStaking() // load staking
  let validator = loadValidator(e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) {
    log.error("Restake rewards: load validator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  let _newTotalValStaked = validator.totalStakedAmount.plus(totalRewards)
  validator.totalStakedAmount = _newTotalValStaked
  validator.totalClaimedRewards = validator.totalClaimedRewards.plus(totalRewards)
  staking.totalClaimedRewards = staking.totalClaimedRewards.plus(totalRewards)
  validator.totalLockStake = validator.totalLockStake.plus(_lockupReward)
  staking.totalLockStake = staking.totalLockStake.plus(_lockupReward)

  staking.save()
  validator.save()
}

function delegationUpdate(e: RestakedRewards, _delegationId: string, _totalRewards: BigInt, _lockedupId: string): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("Restake rewards: load delegation failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegation.totalClaimedRewards = delegation.totalClaimedRewards.plus(_totalRewards)
  delegation.lockedUp = _lockedupId
  delegation.save()
}

function transactionUpdate(e: RestakedRewards, _totalRewards: BigInt, _lockupReward: BigInt): void {
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
  transaction.lockedAmount = _lockupReward
  transaction.save()

  let txCount = TransactionCount.load(e.transaction.from.toString())
  if (txCount === null) {
    txCount = newTransactionCount(e.transaction.from.toString())
  }
  txCount.count.plus(ONE_BI)
  txCount.save()
}