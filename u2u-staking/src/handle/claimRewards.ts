import { log, BigInt } from "@graphprotocol/graph-ts"
import { ClaimedRewards } from "../../generated/SFC/SFC"
import { Delegation, Delegator, Validator } from "../../generated/schema"
import { TransactionType, concatID } from "../helper"
import { loadStaking, newTransaction } from "../initialize"

/**
 * Claimed rewards event handle
 * @param event 
 */
export function claimRewards(e: ClaimedRewards): void {
  log.info("Claimed rewards handle with txHash: {}", [e.transaction.hash.toHexString()])
  const _totalRewards = e.params.lockupBaseReward.plus(e.params.lockupExtraReward).plus(e.params.unlockedReward)
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let staking = loadStaking()
  staking.totalClaimedRewards = staking.totalClaimedRewards.plus(_totalRewards)
  staking.save()
  delegationUpdate(e, _delegationId, _totalRewards)
  transactionUpdate(e, _totalRewards)
  validatorUpdate(e, _totalRewards)
  delegatorUpdate(e, _totalRewards)
}

function delegatorUpdate(e: ClaimedRewards, _totalRewards: BigInt): void {
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("claimedRewards: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegator.totalClaimedRewards = delegator.totalClaimedRewards.plus(_totalRewards)
  delegator.save()
}

function validatorUpdate(e: ClaimedRewards, _totalRewards: BigInt): void {
  let validator = Validator.load(e.params.toValidatorID.toHexString())
  if (validator == null) {
    log.error("claimedRewards: load validator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return;
  }
  validator.totalClaimedRewards = validator.totalClaimedRewards.plus(_totalRewards)
  validator.save()
}

function delegationUpdate(e: ClaimedRewards, _delegationId: string, _totalRewards: BigInt): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("claimedRewards: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }
  delegation.totalClaimedRewards = delegation.totalClaimedRewards.plus(_totalRewards)
  delegation.save()
}

function transactionUpdate(e: ClaimedRewards, _totalRewards: BigInt): void {
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
  transaction.save()
}