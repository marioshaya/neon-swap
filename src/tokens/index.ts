import type { NeonTokens } from "@/types"

const NATIVE_CURRENCY = "0x0000000000000000000000000000000000000000"
export const neonTokens: NeonTokens[] = [
	{
		name: "NEON",
		contractAddress: NATIVE_CURRENCY,
		decimals: 18,
	},
	{
		name: "USDC",
		contractAddress: "0xEA6B04272f9f62F997F666F07D3a974134f7FFb9",
		decimals: 18,
	},
	{
		name: "USDTi",
		contractAddress: "0xc0E49f8C615d3d4c245970F6Dc528E4A47d69a44",
		decimals: 18,
	},
]
