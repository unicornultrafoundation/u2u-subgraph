import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function concatID(str1: string, str2: string): string {
  return str1.concat("-").concat(str2);
}

export function isEqual(str1: string, str2: string): boolean {
  return str1.toLowerCase() == str2.toLowerCase();
}

export function arrayContained(arr: string[], val: string): boolean {
  if (arr.length == 0) return false
  return arr.indexOf(val) > -1;
}

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const ZERO_BYTES = new Bytes(0)

export const STAKING_ADDRESS = Address.fromString('0xfc00face00000000000000000000000000000000')


export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let TWO_BI = BigInt.fromI32(2)
export let HUNDRED_BI = BigInt.fromI32(10000)

export let EMPTY_STRING = "";

export enum TransactionType {
  CreateValidator = 1,
  Delegate = 2,
  Undelegate = 3,
  Withdrawn = 4,
  ClaimRewards = 5,
  Restake = 6,
  LockedUp = 7,
  Unlocked = 8
}
