import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const ZERO_BYTES = new Bytes(0)
export const STAKING_ADDRESS = Address.fromString('0xfc00face00000000000000000000000000000000')

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let TWO_BI = BigInt.fromI32(2)
export let HUNDRED_BI = BigInt.fromI32(10000)

export let EMPTY_STRING = "";
