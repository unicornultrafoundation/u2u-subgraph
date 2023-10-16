import { log, BigInt } from "@graphprotocol/graph-ts"
import { RestakedRewards } from "../../generated/SFC/SFC"
import { TransactionType, concatID } from "../helper"
import { loadStaking, loadValidator, newTransaction } from "../initialize"
import { Delegation, Delegator } from "../../generated/schema"

/**
 * Handle restake rewards
 * @param e 
 */
export function restakRewards(e: RestakedRewards): void {
  log.info("Restake rewards handle with txHash: {}", [e.transaction.hash.toHexString()])
  const _totalRewards = e.params.lockupBaseReward.plus(e.params.lockupExtraReward).plus(e.params.unlockedReward)
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  transactionUpdate(e, _totalRewards)
  delegationUpdate(e, _delegationId, _totalRewards)
  validatorUpdate(e, _totalRewards)
  delegatorUpdate(e, _totalRewards)
}


function delegatorUpdate(e: RestakedRewards, totalRewards: BigInt): void {
  // Delegator table update
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("Restake rewards: load delegator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegator.totalClaimedRewards =  delegator.totalClaimedRewards.plus(totalRewards)
  delegator.save()
}


function validatorUpdate(e: RestakedRewards, totalRewards: BigInt): void {
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

  staking.save()
  validator.save()
}

function delegationUpdate(e: RestakedRewards, _delegationId: string, _totalRewards: BigInt): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("Restake rewards: load delegation failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  delegation.totalClaimedRewards = delegation.totalClaimedRewards.plus(_totalRewards)
  delegation.save()
}

function transactionUpdate(e: RestakedRewards, _totalRewards: BigInt): void {
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