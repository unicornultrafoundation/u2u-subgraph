import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { SFC } from "../../generated/SFC/SFC";
import { STAKING_ADDRESS, ZERO_BI } from "../helper";
import { Delegator, LockedUp, Validation, Validator } from "../../generated/schema";
import { loadStaking } from "../initialize";

export function stashRewards(
  delegatorAddr: Address,
  toValidatorID: BigInt,
  _lockedupId: string,
  _validationId: string,
  _validatorId: string,
  _delegatorId: string
): void {
  let stakingSMC = SFC.bind(STAKING_ADDRESS)
  let isLockedUpResult = stakingSMC.try_isLockedUp(delegatorAddr, toValidatorID)
  if (isLockedUpResult.reverted) {
    log.error("get isLockedUpResult reverted", [])
    return;
  }
  let isLockedUpValue = isLockedUpResult.value
  if (!isLockedUpValue) {
    let lockedup = LockedUp.load(_lockedupId)
    if (lockedup !== null) {
      const locked = lockedup.lockedAmount
      lockedup.lockedAmount = ZERO_BI
      lockedup.save()
      // Update validation
      validationUpdate(_validationId, locked)
      validatorUpdate(_validatorId, locked)
      delegatorUpdate(_delegatorId, locked)
      let staking = loadStaking() // load staking
      if (staking.totalLockStake.gt(locked)) {
        staking.totalLockStake = staking.totalLockStake.minus(locked)
      } else {
        staking.totalLockStake = ZERO_BI
      }
      staking.save()
    }
  }
}

function delegatorUpdate(_delegatorId: string, _locked: BigInt): void {
  let delegator = Delegator.load(_delegatorId)
  if (delegator !== null) {
    if (delegator.totalLockStake.gt(_locked)) {
      delegator.totalLockStake = delegator.totalLockStake.minus(_locked)
    } else {
      delegator.totalLockStake = ZERO_BI
    }
    delegator.save()
  }

}

function validationUpdate(_validationId: string, _locked: BigInt): void {
  let validation = Validation.load(_validationId)
  if (validation !== null) {
    if (validation.totalLockStake.gt(_locked)) {
      validation.totalLockStake = validation.totalLockStake.minus(_locked)
    } else {
      validation.totalLockStake = ZERO_BI
    }
    validation.save()
  }
}

function validatorUpdate(_validatorId: string, _locked: BigInt): void {
  let validator = Validator.load(_validatorId)
  if (validator !== null) {
    if (validator.totalLockStake.gt(_locked)) {
      validator.totalLockStake = validator.totalLockStake.minus(_locked)
    } {
      validator.totalLockStake = ZERO_BI
    }
    validator.save()
  }
}
