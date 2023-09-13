import { ethereum, log, BigInt } from "@graphprotocol/graph-ts"
import {
  SFC
} from "../generated/SFC/SFC"
import { ONE_BI, STAKING_ADDRESS } from "./helper"
import { newEpoch } from "./initialize"
import { Epoch } from "../generated/schema"


export function handleBlockWithCallToContract(block: ethereum.Block): void { }

export function handleBlock(block: ethereum.Block): void {
  log.info("Block handle with number: {}", [block.number.toHexString()])
  let stakingSMC = SFC.bind(STAKING_ADDRESS)
  let currenEpochResult = stakingSMC.try_currentEpoch()
  if (currenEpochResult.reverted) {
    log.error("get currenEpochResult reverted", [])
    return;
  }
  let currentEpochID = currenEpochResult.value
  if(currentEpochID.isZero()) {
    log.error("Epoch zero", [])
    return;
  }
  let lastEpoch = currentEpochID.minus(ONE_BI)
  log.info("Epoch handle with currentEpoch: {}, lastEpoch: {}", [currentEpochID.toString(), lastEpoch.toString()])
  let epochEntity = Epoch.load(lastEpoch.toHexString())
  if (epochEntity != null) {
    return
  }
  epochEntity = newEpoch(lastEpoch.toHexString())
  epochEntity.epoch = lastEpoch
  epochEntity.block = block.number
  let epochSnapshotResult = stakingSMC.try_getEpochSnapshot(lastEpoch)
  if (epochSnapshotResult.reverted) {
    log.error("get epochSnapshotResult reverted", [])
    return
  }
  let epochSnapshot= epochSnapshotResult.value
  epochEntity.endTime = epochSnapshot.getEndTime()
  epochEntity.totalBaseReward = epochSnapshot.getTotalBaseRewardWeight()
  epochEntity.totalTxReward = epochSnapshot.getTotalTxRewardWeight()
  epochEntity.totalStake = epochSnapshot.getTotalStake()
  epochEntity.totalSupply = epochSnapshot.getTotalSupply()
  epochEntity.rewardPerSecond = epochSnapshot.getBaseRewardPerSecond()
  epochEntity.epochFee = epochSnapshot.getEpochFee()
  log.info("Handle new epoch with, EndTime: {}, TotalBaseReward: {}, TotalTxReward: {}, totalStake:{}, totalSupply:{}, rewardPerSecond:{}, epochFee:{}",
    [
      epochSnapshot.getEndTime().toString(),
      epochSnapshot.getTotalBaseRewardWeight().toString(),
      epochSnapshot.getTotalTxRewardWeight().toString(),
      epochSnapshot.getTotalStake().toString(),
      epochSnapshot.getTotalSupply().toString(),
      epochSnapshot.getBaseRewardPerSecond().toString(),
      epochSnapshot.getEpochFee().toString()
    ])
  epochEntity.save()
}
