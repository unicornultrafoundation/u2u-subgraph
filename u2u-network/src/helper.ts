import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const ZERO_BYTES = new Bytes(0)
export const STAKING_ADDRESS = Address.fromString('0xfc00face00000000000000000000000000000000')

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let TWO_BI = BigInt.fromI32(2)
export let HUNDRED_BI = BigInt.fromI32(100)
export let FIVE_BI = BigInt.fromI32(5)

export let DECIMAL_BI = BigInt.fromI64(1000000000000000000)

export let EMPTY_STRING = "";


export function concatID(str1: string, str2: string): string {
  return str1.concat("-").concat(str2);
}

export const blockSkip = BigInt.fromI32(200) // Block skip
