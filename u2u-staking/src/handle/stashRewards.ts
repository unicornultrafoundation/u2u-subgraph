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
      lockedup.unlockedAmount = lockedup.unlockedAmount.plus(locked)
      lockedup.save()
      // Update validation
      validationUpdate(_validationId, locked)
      validatorUpdate(_validatorId, locked)
      delegatorUpdate(_delegatorId, locked)
      let staking = loadStaking() // load staking
      staking.totalLockStake = staking.totalLockStake.minus(locked)
      staking.save()
    }
  }
}

function delegatorUpdate(_delegatorId: string, _locked: BigInt): void {
  let delegator = Delegator.load(_delegatorId)
  if (delegator !== null) {
    delegator.totalLockStake = delegator.totalLockStake.minus(_locked)
    delegator.save()
  }

}

function validationUpdate(_validationId: string, _locked: BigInt): void {
  let validation = Validation.load(_validationId)
  if (validation !== null) {
    validation.totalLockStake = validation.totalLockStake.minus(_locked)
    validation.save()
  }

}

function validatorUpdate(_validatorId: string, _locked: BigInt): void {
  let validator = Validator.load(_validatorId)
  if (validator !== null) {
    validator.totalLockStake = validator.totalLockStake.minus(_locked)
    validator.save()
  }

}
