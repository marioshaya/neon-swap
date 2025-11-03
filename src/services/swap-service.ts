import { ethers } from "ethers"
import { config } from "@/config"
import { neonTokens } from "@/tokens"
import type { SelectTokensState } from "@/types"

const V2_ROUTER_ABI = [
	"function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
]

export class SwapService {
	private provider: ethers.JsonRpcProvider
	private router: ethers.Contract

	constructor() {
		this.provider = new ethers.JsonRpcProvider(config.rpc)
		this.router = new ethers.Contract(
			config.icecreamSwapV2Router,
			V2_ROUTER_ABI,
			this.provider,
		)
	}

	private resolveTokenAddress(symbol: SelectTokensState): {
		address: string
		decimals: number
	} {
		if (symbol === "NEON") {
			if (!config.wrappedNative || config.wrappedNative === "") {
				throw new Error("Wrapped native token address is not configured")
			}
			// Use wrapped native for routing
			const wrapped = neonTokens.find(
				(t) =>
					t.contractAddress.toLowerCase() ===
					config.wrappedNative.toLowerCase(),
			)
			return {
				address: config.wrappedNative,
				decimals: wrapped?.decimals ?? 18,
			}
		}

		const token = neonTokens.find((t) => t.name === symbol)
		if (!token) {
			throw new Error(`Unknown token: ${symbol}`)
		}
		return { address: token.contractAddress, decimals: token.decimals }
	}

	async getQuote(params: {
		inputSymbol: SelectTokensState
		outputSymbol: SelectTokensState
		amountIn: string
	}): Promise<{ amountOutFormatted: string; amountOut: bigint } | null> {
		const { inputSymbol, outputSymbol, amountIn } = params

		try {
			if (!amountIn || Number(amountIn) <= 0) return null

			const input = this.resolveTokenAddress(inputSymbol)
			const output = this.resolveTokenAddress(outputSymbol)

			const amountInWei = ethers.parseUnits(amountIn, input.decimals)

			const path: string[] = [input.address, output.address]

			const amounts: bigint[] = await this.router.getAmountsOut(
				amountInWei,
				path,
			)
			const amountOut = amounts[amounts.length - 1]
			const amountOutFormatted = ethers.formatUnits(amountOut, output.decimals)

			return { amountOutFormatted, amountOut }
		} catch (error) {
			console.error("Quote error:", error)
			return null
		}
	}
}
