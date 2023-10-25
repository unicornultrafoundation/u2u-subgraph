import {
  SFC,
  BurntFTM,
  ClaimedRewards,
  CreatedValidator,
  Delegated,
  InflatedFTM,
  LockedUpStake,
  RefundedSlashedLegacyDelegation,
  RestakedRewards,
  Undelegated,
  UnlockedStake,
  UpdatedSlashingRefundRatio,
  Withdrawn,
  StashRewardsCall
} from "../generated/SFC/SFC"
import { createdValidator } from "./handle/createValidator";
import { delegate } from "./handle/delegate";
import { undelegate } from "./handle/undelegate";
import { withdrawn } from "./handle/withdrawn";
import { claimRewards } from "./handle/claimRewards";
import { restakRewards } from "./handle/restakeRewards";
import { lockUpStake } from "./handle/lockStake";
import { unlockStake } from "./handle/unlockStake";
import { stashRewards } from "./handle/stashRewards";
import { concatID } from "./helper";

export function handleCreatedValidator(e: CreatedValidator): void {
  createdValidator(e);
}

export function handleDelegated(e: Delegated): void {
  delegate(e)
}

export function handleUndelegated(e: Undelegated): void {
  undelegate(e)
}

export function handleWithdrawn(e: Withdrawn): void {
  withdrawn(e)
}

export function handleClaimedRewards(e: ClaimedRewards): void {
  claimRewards(e)
}

export function handleRestakedRewards(e: RestakedRewards): void {
  restakRewards(e)
}

export function handleLockedUpStake(e: LockedUpStake): void {
  lockUpStake(e)
}

export function handleUnlockedStake(e: UnlockedStake): void {
  unlockStake(e)
}

export function handleStashRewards(call: StashRewardsCall): void {
  let _lockedupId = concatID(call.inputs.toValidatorID.toHexString(), call.inputs.delegator.toHexString())
  let _validationId = concatID(call.inputs.delegator.toHexString(), call.inputs.toValidatorID.toHexString())
  let _validatorId = call.inputs.toValidatorID.toHexString()
  let _delegatorId = call.inputs.delegator.toHexString()
  //Handle Stash reward
  stashRewards(
    call.inputs.delegator,
    call.inputs.toValidatorID,
    _lockedupId,
    _validationId,
    _validatorId,
    _delegatorId
  )
}

export function handleBurntFTM(event: BurntFTM): void { }
export function handleInflatedFTM(event: InflatedFTM): void { }
export function handleRefundedSlashedLegacyDelegation(
  event: RefundedSlashedLegacyDelegation
): void { }
export function handleUpdatedSlashingRefundRatio(
  event: UpdatedSlashingRefundRatio
): void { }
