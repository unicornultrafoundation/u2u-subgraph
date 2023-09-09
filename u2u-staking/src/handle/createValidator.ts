import { log, BigInt } from "@graphprotocol/graph-ts";
import { CreatedValidator } from "../../generated/SFC/SFC";
import { Validator } from "../../generated/schema";
import { loadStaking, newTransaction, newValidator } from "../initialize";
import { ONE_BI, TransactionType, concatID } from "../helper";

export function createdValidator(e: CreatedValidator): void {
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
  staking.save()
  validator.save()
  transactionUpdate(e)
}

function transactionUpdate(e: CreatedValidator): void {
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
  transaction.save()
}