import { ethereum, log, BigInt } from "@graphprotocol/graph-ts"
import {
  SFC
} from "../generated/SFC/SFC"
import { DECIMAL_BI, ONE_BI, STAKING_ADDRESS, ZERO_BI, concatID } from "./helper"
import { newEpoch, newValidator } from "./initialize"
import { Epoch, Validator } from "../generated/schema"


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
  if (currentEpochID.isZero()) {
    log.error("Epoch zero", [])
    return;
  }
  
  let _lastEpoch = currentEpochID.minus(ONE_BI)
  log.info("Epoch handle with currentEpoch: {}, lastEpoch: {}", [currentEpochID.toString(), _lastEpoch.toString()])
  updateEpoch(_lastEpoch, block, stakingSMC)
  updateValidators(_lastEpoch)
}

function updateEpoch(_lastEpoch: BigInt, block: ethereum.Block, stakingSMC: SFC): void {
  let epochEntity = Epoch.load(_lastEpoch.toHexString())
  if (epochEntity != null) {
    return
  }
  epochEntity = newEpoch(_lastEpoch.toHexString())
  epochEntity.epoch = _lastEpoch
  epochEntity.block = block.number.minus(ONE_BI)
  let epochSnapshotResult = stakingSMC.try_getEpochSnapshot(_lastEpoch)
  if (epochSnapshotResult.reverted) {
    log.error("get epochSnapshotResult reverted", [])
    return
  }
  let epochSnapshot = epochSnapshotResult.value
  epochEntity.endTime = epochSnapshot.getEndTime()
  epochEntity.totalBaseReward = epochSnapshot.getTotalBaseRewardWeight()
  epochEntity.totalTxReward = epochSnapshot.getTotalTxRewardWeight()
  epochEntity.totalStake = epochSnapshot.getTotalStake()
  epochEntity.totalSupply = epochSnapshot.getTotalSupply()
  epochEntity.rewardPerSecond = epochSnapshot.getBaseRewardPerSecond()
  epochEntity.epochFee = epochSnapshot.getEpochFee()
  let _epochRewards = ZERO_BI
  if (_lastEpoch.gt(ONE_BI)) {
    let _privEpoch = Epoch.load(_lastEpoch.minus(ONE_BI).toHexString())
    if (_privEpoch != null) {
      let _epochTimeSeconds = ZERO_BI
      if (epochSnapshot.getEndTime().gt(_privEpoch.endTime)) {
        _epochTimeSeconds = epochSnapshot.getEndTime().minus(_privEpoch.endTime)
      }
      _epochRewards = _epochTimeSeconds.times(epochSnapshot.getBaseRewardPerSecond()).plus(epochSnapshot.getEpochFee())
      epochEntity.epochRewards = _epochRewards
      epochEntity.totalRewards = _privEpoch.totalRewards.plus(_epochRewards)
    }
  }
  epochEntity.save()
}

function updateValidators(epochId: BigInt): void {
  let _validators = getEpochValidators(epochId)
  if (_validators.length == 0) {
    log.error("get getEpochValidators empty", [])
    return;
  }
  for (let i = 0; i < _validators.length; ++i) {
    _updateValidator(epochId, _validators[i])
  }
}

function _updateValidator(epochId: BigInt, validatorId: BigInt): void {
  let stakingSMC = SFC.bind(STAKING_ADDRESS)
  let _receivedStake = stakingSMC.try_getEpochReceivedStake(epochId, validatorId)
  let _accumulatedRewardPerToken = stakingSMC.try_getEpochAccumulatedRewardPerToken(epochId, validatorId)
  let _entityId = concatID(epochId.toHexString(), validatorId.toHexString())
  let valEntity = Validator.load(_entityId)
  if (valEntity == null) {
    valEntity = newValidator(_entityId)
    valEntity.validatorId = validatorId
    valEntity.epoch = epochId.toHexString()
  }
  valEntity.receivedStake = _receivedStake.value
  valEntity.accumulatedRewardPerToken = _accumulatedRewardPerToken.value
  let _totalEpochRewards = _receivedStake.value.times(_accumulatedRewardPerToken.value).div(DECIMAL_BI)
  if (epochId.gt(ONE_BI)) {
    let _prevId = concatID((epochId.minus(ONE_BI)).toHexString(), validatorId.toHexString())
    let _prevEpoch = Validator.load(_prevId)
    if (_prevEpoch != null) {
      let _prevTotalEpochRewards = _prevEpoch.totalRewards
      valEntity.epochRewards = _totalEpochRewards.minus(_prevTotalEpochRewards)
    }
  } else {
    valEntity.epochRewards = _totalEpochRewards;
  }
  valEntity.totalRewards = _totalEpochRewards;
  let epochEntity = Epoch.load(epochId.toHexString())
  if (epochEntity != null) {
    let _validators = epochEntity.validators
    _validators.push(_entityId)
    epochEntity.validators = _validators
    epochEntity.save()
  }
  valEntity.save()
}

function getEpochValidators(epochId: BigInt): BigInt[] {
  let stakingSMC = SFC.bind(STAKING_ADDRESS)
  let validators = stakingSMC.try_getEpochValidatorIDs(epochId)
  if (validators.reverted) {
    log.error("get try_getEpochValidatorIDs reverted", [])
    return [];
  }
  return validators.value
}

