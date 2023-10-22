import { log, BigInt } from "@graphprotocol/graph-ts"
import { Delegated } from "../../generated/SFC/SFC"
import { loadStaking, loadValidator, newDelegation, newDelegator, newTransaction, newTransactionCount, newValidation } from "../initialize"
import { ONE_BI, TransactionType, arrayContained, concatID, isEqual } from "../helper"
import { Delegation, Delegator, TransactionCount, Validation } from "../../generated/schema"

export function delegate(e: Delegated): void {
  log.info("Delegated handle with txHash: {}", [e.transaction.hash.toHexString()])
  let _validationId = concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString())
  let _delegationId = concatID(e.params.toValidatorID.toHexString(), e.params.delegator.toHexString())
  validationUpdate(e, _validationId)
  delegationUpdate(e, _delegationId)
  delegatorUpdate(e, _validationId)
  validatorUpdate(e, _delegationId)
  transactionUpdate(e)
}

function delegatorUpdate(e: Delegated, _validationId: string): void {
  let staking = loadStaking() // load staking 
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
  staking.save()
  delegator.save()
}

function validatorUpdate(e: Delegated, _delegationId: string): void {
  let staking = loadStaking() // load staking
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
    validator.totalDelegator = validator.totalDelegator.plus(ONE_BI)
  }
  validator.delegations = _valDelegations;

  staking.save()
  validator.save()
}

function delegationUpdate(e: Delegated, _delegationId: string): void {
  let delegation = Delegation.load(_delegationId)
  if (delegation == null) {
    delegation = newDelegation(_delegationId)
    delegation.delegator = e.params.delegator.toHexString()
    delegation.validatorId = e.params.toValidatorID
  }
  delegation.stakedAmount = delegation.stakedAmount.plus(e.params.amount)
  delegation.save()
}

function validationUpdate(e: Delegated, _validationId: string): void {
  let validation = Validation.load(_validationId)
  if (validation == null) {
    validation = newValidation(_validationId)
    validation.validator = e.params.toValidatorID.toHexString();
  }
  validation.stakedAmount = validation.stakedAmount.plus(e.params.amount)
  validation.save()
}

function transactionUpdate(e: Delegated): void {
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
  transaction.save()

  let txCount = TransactionCount.load(e.transaction.from.toString())
  if (txCount === null) {
    txCount = newTransactionCount(e.transaction.from.toString())
  }
  txCount.count.plus(ONE_BI)
  txCount.save()
}