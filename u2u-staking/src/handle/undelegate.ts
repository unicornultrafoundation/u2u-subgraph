import { log, BigInt } from "@graphprotocol/graph-ts"
import { Undelegated } from "../../generated/SFC/SFC"
import { loadStaking, loadValidator, newTransaction, newTransactionCount, newWithdrawalRequest } from "../initialize"
import { ONE_BI, TransactionType, ZERO_BI, concatID, isEqual } from "../helper"
import { Delegation, Delegator, TransactionCount, Validation, WithdrawalRequest } from "../../generated/schema"
import { stashRewards } from "./stashRewards"

export function undelegate(e: Undelegated): void {
  log.info("Undelegated handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Validation update
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString())
  // Handle withdrawal request
  let _wrId = concatID(concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString()), e.params.wrID.toHexString())
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let _lockedupId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  let _validatorId = e.params.toValidatorID.toHexString()
  let _delegatorId = e.params.delegator.toHexString()

  //Handle Stash reward
  stashRewards(
    e.params.delegator,
    e.params.toValidatorID,
    _lockedupId,
    _validationId,
    _validatorId,
    _delegatorId
  )

  transactionUpdate(e)
  validationUpdate(e, _validationId)
  delegationUpdate(e, _delegationId, _wrId)
  validatorUpdate(e)
  delegatorUpdate(e)
  withdrawalRequestUpdate(e, _wrId)
}

function withdrawalRequestUpdate(e: Undelegated, _wrId: string): void {
  let withdrawalRequest = WithdrawalRequest.load(_wrId)
  if (withdrawalRequest == null) {
    withdrawalRequest = newWithdrawalRequest(_wrId)
    withdrawalRequest.delegatorAddress = e.params.delegator
    withdrawalRequest.validatorId = e.params.toValidatorID
    withdrawalRequest.wrID = e.params.wrID
    withdrawalRequest.hash = e.transaction.hash
  }
  withdrawalRequest.unbondingAmount = withdrawalRequest.unbondingAmount.plus(e.params.amount)
  withdrawalRequest.time = e.block.timestamp;

  withdrawalRequest.save()
}

function delegatorUpdate(e: Undelegated): void {
  let delegator = Delegator.load(e.params.delegator.toHexString())
  if (delegator == null) {
    log.error("undelegated: load delegator failed with ID: {}, txHash: {}", [e.params.delegator.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  if (delegator.stakedAmount.gt(e.params.amount)) {
    delegator.stakedAmount = delegator.stakedAmount.minus(e.params.amount)
  } else {
    delegator.stakedAmount = ZERO_BI
  }
  delegator.save()
}

function validatorUpdate(e: Undelegated): void {
  let staking = loadStaking() // load staking
  let validator = loadValidator(e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString())
  if (validator == null) {
    log.error("undelegated: load validator failed with ID: {}, txHash: {}", [e.params.toValidatorID.toHexString(), e.transaction.hash.toHexString()])
    return
  }
  if (isEqual(validator.auth.toHexString(), e.params.delegator.toHexString())) {
    if (validator.selfStaked.gt(e.params.amount)) {
      validator.selfStaked = validator.selfStaked.minus(e.params.amount)
    } else {
      validator.selfStaked = ZERO_BI
    }
    if (staking.totalSelfStaked.gt(e.params.amount)) {
      staking.totalSelfStaked = staking.totalSelfStaked.minus(e.params.amount)
    } else {
      staking.totalSelfStaked = ZERO_BI
    }
  } else {
    if (validator.delegatedAmount.gt(e.params.amount)) {
      validator.delegatedAmount = validator.delegatedAmount.minus(e.params.amount)
    } else {
      validator.delegatedAmount = ZERO_BI
    }

    if (staking.totalDelegated.gt(e.params.amount)) {
      staking.totalDelegated = staking.totalDelegated.minus(e.params.amount)
    } else {
      staking.totalDelegated = ZERO_BI
    }
  }
  let _newTotalValStaked = validator.totalStakedAmount.minus(e.params.amount)
  let _newTotalStaked = staking.totalStaked.minus(e.params.amount)
  validator.totalStakedAmount = _newTotalValStaked
  staking.totalStaked = _newTotalStaked

  staking.save()
  validator.save()
}

function delegationUpdate(e: Undelegated, _delegationId: string, _wrId: string): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    log.error("undelegated: load delegation failed with ID: {}, txHash: {}", [_delegationId, e.transaction.hash.toHexString()])
    return
  }
  if (delegation.stakedAmount.gt(e.params.amount)) {
    delegation.stakedAmount = delegation.stakedAmount.minus(e.params.amount)
  } else {
    delegation.stakedAmount = ZERO_BI
  }
  delegation.wr = _wrId
  delegation.save()
}


function validationUpdate(e: Undelegated, _validationId: string): void {
  let validation = Validation.load(_validationId)
  if (validation == null) {
    log.error("undelegated: load validation failed with ID: {}, txHash: {}", [_validationId, e.transaction.hash.toHexString()])
    return
  }
  if (validation.stakedAmount.gt(e.params.amount)) {
    validation.stakedAmount = validation.stakedAmount.minus(e.params.amount)
  } else {
    validation.stakedAmount = ZERO_BI
  }
  validation.save()
}


function transactionUpdate(e: Undelegated): void {
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
  transaction.save()

  let txCount = TransactionCount.load(e.transaction.from.toHexString())
  if (txCount === null) {
    txCount = newTransactionCount(e.transaction.from.toHexString())
  }
  txCount.count = txCount.count.plus(ONE_BI)
  txCount.save()
}