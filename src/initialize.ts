import { BigInt } from "@graphprotocol/graph-ts";
import { Delegation, Delegator, LockedUp, Staking, Transation, Validation, Validator, WithdrawalRequest } from "../generated/schema";
import { EMPTY_STRING, ONE_BI, ZERO_BI, ZERO_BYTES } from "./helper";

/**
 * Initialize new validation entity
 * @param _valId 
 * @returns 
 */
export function newValidator(_valId: BigInt): Validator {
  let validator = new Validator(_valId.toHexString())
  validator.validatorId = _valId
  validator.auth = ZERO_BYTES
  validator.createdEpoch = ZERO_BI
  validator.createdTime = ZERO_BI
  validator.hash = ZERO_BYTES
  validator.selfStaked = ZERO_BI
  validator.delegatedAmount = ZERO_BI
  validator.totalStakedAmount = ZERO_BI
  validator.active = ZERO_BI
  validator.online = ZERO_BI
  validator.downTime = ZERO_BI
  validator.lockedUntil = ZERO_BI
  validator.lockDays = ZERO_BI
  validator.createdEpoch = ZERO_BI
  validator.createdTime = ZERO_BI
  validator.delegations = []
  validator.votingPower = ZERO_BI
  validator.totalClaimedRewards = ZERO_BI
  return validator
}

/**
 * Initialize new validation entity
 * @param _validationId 
 * @returns 
 */
export function newValidation(_validationId: string): Validation {
  let validation = new Validation(_validationId)
  validation.validator = EMPTY_STRING
  validation.stakedAmount = ZERO_BI
  return validation
}

/**
 * Initialize new delegation entity
 * @param _delegationId 
 */
export function newDelegation(_delegationId: string): Delegation {
  let delegation = new Delegation(_delegationId)
  delegation.validatorId = ZERO_BI
  delegation.delegator = EMPTY_STRING
  delegation.stakedAmount = ZERO_BI
  delegation.wr = EMPTY_STRING
  delegation.totalClaimedRewards = ZERO_BI
  return delegation
}

/**
 * Initialize new delegator entity
 * @param _delegatorId 
 * @returns 
 */
export function newDelegator(_delegatorId: string): Delegator {
  let delegator = new Delegator(_delegatorId)
  delegator.address = ZERO_BYTES
  delegator.createdOn = ZERO_BI
  delegator.stakedAmount = ZERO_BI
  delegator.validations = []
  delegator.totalClaimedRewards = ZERO_BI
  return delegator
}

/**
 * Initialize new withdrawal request
 * @param _wrId 
 * @returns 
 */
export function newWithdrawalRequest(_wrId: string): WithdrawalRequest {
  let wr = new WithdrawalRequest(_wrId)
  wr.delegatorAddress = ZERO_BYTES
  wr.validatorId = ZERO_BI
  wr.unbondingAmount = ZERO_BI
  wr.time = ZERO_BI
  wr.wrID = ZERO_BI
  wr.hash = ZERO_BYTES
  return wr
}

/**
 * load staking entity
 * @returns 
 */
export function loadStaking(): Staking {
  let _id = ONE_BI.toHexString()
  let staking = Staking.load(_id)
  if (staking == null) {
    staking = new Staking(_id)
    staking.totalStaked = ZERO_BI
    staking.totalDelegated = ZERO_BI
    staking.totalSelfStaked = ZERO_BI
    staking.totalValidator = ZERO_BI
    staking.totalDelegator = ZERO_BI
    staking.totalClaimedRewards = ZERO_BI
  }
  return staking
}

/**
 * Initialize new transaction records
 * @param id 
 * @returns 
 */
export function newTransaction(id: string): Transation {
  let transaction = new Transation(id)
  transaction.txHash = ZERO_BYTES
  transaction.type = ZERO_BI
  transaction.from = ZERO_BYTES
  transaction.to = ZERO_BYTES
  transaction.validatorId = ZERO_BI
  transaction.delegator = ZERO_BYTES
  transaction.createdAt = ZERO_BI
  transaction.block = ZERO_BI
  transaction.stakedAmount = ZERO_BI
  transaction.claimedAmount = ZERO_BI
  transaction.undelegatedAmount = ZERO_BI
  transaction.withdrawalAmount = ZERO_BI
  transaction.wrID = ZERO_BI
  transaction.lockedAmount = ZERO_BI
  transaction.lockDuration = ZERO_BI
  transaction.unlockedAmount = ZERO_BI
  transaction.penaltyAmount = ZERO_BI
  return transaction
}

export function newLockedUp(_id: string): LockedUp {
  let lockedup = new LockedUp(_id)
  lockedup.delegator = EMPTY_STRING
  lockedup.validator = EMPTY_STRING
  lockedup.duration = ZERO_BI
  lockedup.lockedAmount = ZERO_BI
  lockedup.unlockedAmount = ZERO_BI
  lockedup.penalty = ZERO_BI
  return lockedup
}

export function calVotingPower(valStaked: BigInt, totalStaked: BigInt): BigInt {
  if (valStaked.isZero() || totalStaked.isZero()) return ZERO_BI
  return valStaked.times(BigInt.fromI32(1000000)).div(totalStaked)
}