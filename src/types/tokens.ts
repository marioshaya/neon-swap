export interface NeonTokens {
	name: SelectTokensState
	contractAddress: string
	decimals: number
}

export type SelectTokensState = "NEON" | "USDC" | "USDTi"
