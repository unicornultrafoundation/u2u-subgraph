import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Delegation, Delegator, Staking, Validation, Validator, WithdrawalRequest } from "../generated/schema";
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
  return validator
}

/**
 * Initialize new validation entity
 * @param _validationId 
 * @returns 
 */
export function newValidation(_validationId: string): Validation {
  let validation = new Validation(_validationId)
  validation.validatorId = EMPTY_STRING
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
  return delegator
}

export function newWithdrawalRequest(_wrId: string): WithdrawalRequest {
  let wr = new WithdrawalRequest(_wrId)
  wr.delegatorAddress = ZERO_BYTES
  wr.validatorId = ZERO_BI
  wr.epoch = ZERO_BI
  wr.amount = ZERO_BI
  wr.time = ZERO_BI
  return wr
}

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
    staking.maxDailyRewards = ZERO_BI
  }
  return staking
}