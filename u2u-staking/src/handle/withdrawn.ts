import { log, BigInt } from "@graphprotocol/graph-ts"
import { Withdrawn } from "../../generated/SFC/SFC"
import { TransactionType, concatID } from "../helper"
import { WithdrawalRequest } from "../../generated/schema"
import { newTransaction } from "../initialize"

/**
 * Withdrawn event handle
 * @param event 
 */

export function withdrawn(e: Withdrawn): void {
  log.info("Withdraw handle with txHash: {}", [e.transaction.hash.toHexString()])
  // Handle withdrawal request
  let _wrId = concatID(concatID(e.params.delegator.toHexString(), e.params.toValidatorID.toHexString()), e.params.wrID.toHexString())
  transactionUpdate(e)
  withdrawalRequestUpdate(e, _wrId)
}

function withdrawalRequestUpdate(e: Withdrawn, _wrId: string): void {
  let withdrawalRequest = WithdrawalRequest.load(_wrId)
  if (withdrawalRequest == null) {
    log.error("withdraw: load wr failed with ID: {}, txHash: {}", [_wrId, e.transaction.hash.toHexString()])
    return
  }
  withdrawalRequest.unbondingAmount = withdrawalRequest.unbondingAmount.minus(e.params.amount)
  withdrawalRequest.withdrawalAmount = withdrawalRequest.withdrawalAmount.plus(e.params.amount)
  withdrawalRequest.withdrawHash = e.transaction.hash
  withdrawalRequest.withdrawTime = e.block.timestamp
  withdrawalRequest.save()
}

function transactionUpdate(e: Withdrawn): void {
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
  transaction.save()
}