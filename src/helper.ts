import { BigInt } from "@graphprotocol/graph-ts";

export function concatID(str1: string, str2: string): string {
  return str1.concat("-").concat(str2);
}

export function isEqual(str1: string, str2: string): boolean {
  return str1.toLowerCase() == str2.toLowerCase();
}

export function arrayContained(arr: string[], val: string): boolean {
  if (!arr || arr.length == 0) return false
  return arr.indexOf(val) > -1;
}

export let ZERO_BI = BigInt.fromI32(0)
export let EMPTY_STRING = "";
