export function concatID(str1: string, str2: string): string {
  return str1.concat("-").concat(str2);
}

export function isEqual(str1: string, str2: string): boolean {
  return str1.toLowerCase() == str2.toLowerCase();
}