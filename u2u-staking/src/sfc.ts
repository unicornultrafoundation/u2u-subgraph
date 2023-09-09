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
  Withdrawn
} from "../generated/SFC/SFC"
import { createdValidator } from "./handle/createValidator";
import { delegate } from "./handle/delegate";
import { undelegate } from "./handle/undelegate";
import { withdrawn } from "./handle/withdrawn";
import { claimRewards } from "./handle/claimRewards";
import { restakRewards } from "./handle/restakeRewards";
import { lockUpStake } from "./handle/lockStake";
import { unlockStake } from "./handle/unlockStake";

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

export function handleBurntFTM(event: BurntFTM): void { }
export function handleInflatedFTM(event: InflatedFTM): void { }
export function handleRefundedSlashedLegacyDelegation(
  event: RefundedSlashedLegacyDelegation
): void { }
export function handleUpdatedSlashingRefundRatio(
  event: UpdatedSlashingRefundRatio
): void { }
