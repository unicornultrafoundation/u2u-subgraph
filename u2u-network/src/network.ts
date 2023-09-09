import { ethereum, log } from "@graphprotocol/graph-ts"
import {
  SFC
} from "../generated/SFC/SFC"
import { STAKING_ADDRESS } from "./helper"
import { Epoch } from "../generated/schema"


export function handleBlockWithCallToContract(block: ethereum.Block): void {}

export function handleBlock(block: ethereum.Block): void {
  log.info("Block handle with number: {}", [block.number.toHexString()])
  let stakingSMC = SFC.bind(STAKING_ADDRESS)    
  let currenEpoch = stakingSMC.currentEpoch()
  let epochEntity = Epoch.load(currenEpoch.toHexString())
  if(epochEntity === null) {
    epochEntity = new Epoch(currenEpoch.toHexString())
    let epochSnapshot = stakingSMC.getEpochSnapshot(currenEpoch)
    epochEntity.epoch = currenEpoch;
    epochEntity.block = block.number;
    epochEntity.endTime = epochSnapshot.getEndTime()
    epochEntity.totalBaseReward = epochSnapshot.getTotalBaseRewardWeight()
    epochEntity.totalTxReward = epochSnapshot.getTotalTxRewardWeight()
    epochEntity.totalStake = epochSnapshot.getTotalStake()
    epochEntity.totalSupply = epochSnapshot.getTotalSupply()
    epochEntity.rewardPerSecond = epochSnapshot.getBaseRewardPerSecond()
    epochEntity.epochFee = epochSnapshot.getEpochFee()
    epochEntity.save()
  }
}
