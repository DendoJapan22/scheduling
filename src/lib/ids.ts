import { customAlphabet } from "nanoid";

// 紛らわしい文字（0/O, 1/l/I）を除いた英数字
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

export const newPublicId = customAlphabet(ALPHABET, 10); // 56^10 ≈ 3×10^17
export const newToken = customAlphabet(ALPHABET, 32); // 56^32 ≈ 10^56
