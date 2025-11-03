import { ethers } from "ethers"
import { config } from "@/config"
import { neonTokens } from "@/tokens"
import type { SelectTokensState } from "@/types"

const V2_ROUTER_ABI = [
	"function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
	"function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)",
]

const ERC20_READ_ABI = ["function decimals() view returns (uint8)"]

export class SwapService {
	private provider: ethers.JsonRpcProvider
	private router: ethers.Contract
	private decimalsCache: Map<string, number> = new Map()

	constructor(rpcUrl: string) {
		this.provider = new ethers.JsonRpcProvider(rpcUrl)
		this.router = new ethers.Contract(
			config.icecreamSwapV2Router,
			V2_ROUTER_ABI,
			this.provider,
		)
	}

	private async resolveToken(symbol: SelectTokensState): Promise<{
		address: string
		decimals: number
	}> {
		if (symbol === "NEON") {
			if (!config.wrappedNative || config.wrappedNative === "") {
				throw new Error("Wrapped native token address is not configured")
			}
			// NEON uses wrapped native; decimals are 18 on-chain
			return { address: config.wrappedNative, decimals: 18 }
		}

		const token = neonTokens.find((t) => t.name === symbol)
		if (!token) {
			throw new Error(`Unknown token: ${symbol}`)
		}
		const addr = token.contractAddress
		const cached = this.decimalsCache.get(addr.toLowerCase())
		if (typeof cached === "number") {
			return { address: addr, decimals: cached }
		}
		const erc20 = new ethers.Contract(addr, ERC20_READ_ABI, this.provider)
		const decimals: number = await erc20.decimals()
		this.decimalsCache.set(addr.toLowerCase(), decimals)
		return { address: addr, decimals }
	}

	async getQuote(params: {
		inputSymbol: SelectTokensState
		outputSymbol: SelectTokensState
		amountIn: string
	}): Promise<{ amountOutFormatted: string; amountOut: bigint } | null> {
		const { inputSymbol, outputSymbol, amountIn } = params

		try {
			if (!amountIn || Number(amountIn) <= 0) return null

			const [input, output] = await Promise.all([
				this.resolveToken(inputSymbol),
				this.resolveToken(outputSymbol),
			])

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

	async getQuoteForOutput(params: {
		inputSymbol: SelectTokensState
		outputSymbol: SelectTokensState
		amountOut: string
	}): Promise<{ amountInFormatted: string; amountIn: bigint } | null> {
		const { inputSymbol, outputSymbol, amountOut } = params

		try {
			if (!amountOut || Number(amountOut) <= 0) return null

			const [input, output] = await Promise.all([
				this.resolveToken(inputSymbol),
				this.resolveToken(outputSymbol),
			])

			const amountOutWei = ethers.parseUnits(amountOut, output.decimals)

			const path: string[] = [input.address, output.address]

			const amounts: bigint[] = await this.router.getAmountsIn(
				amountOutWei,
				path,
			)
			const amountIn = amounts[0]
			const amountInFormatted = ethers.formatUnits(amountIn, input.decimals)

			return { amountInFormatted, amountIn }
		} catch (error) {
			console.error("Reverse quote error:", error)
			return null
		}
	}
}
