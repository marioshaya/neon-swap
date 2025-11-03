import { ethers } from "ethers"
import { config } from "@/config"
import { neonTokens } from "@/tokens"
import type { SelectTokensState } from "@/types"

const V2_ROUTER_ABI = [
	"function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
	"function getAmountsIn(uint256 amountOut, address[] calldata path) external view returns (uint256[] memory amounts)",
	// swap functions
	"function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)",
	"function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
	"function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
]

const ERC20_READ_ABI = [
	"function decimals() view returns (uint8)",
	"function allowance(address owner, address spender) view returns (uint256)",
]
const ERC20_WRITE_ABI = [
	"function approve(address spender, uint256 amount) returns (bool)",
]

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

	async swapExactInput(params: {
		inputSymbol: SelectTokensState
		outputSymbol: SelectTokensState
		amountInFormatted: string
		recipient: string
		slippageBps?: number // defaults to 50 (0.5%)
	}): Promise<{ txHash: string }> {
		const { inputSymbol, outputSymbol, amountInFormatted, recipient } = params
		const slippageBps = params.slippageBps ?? 50

		if (!amountInFormatted || Number(amountInFormatted) <= 0) {
			throw new Error("Invalid amount")
		}

		// Resolve tokens and compute minOut based on current quote
		const [input, output] = await Promise.all([
			this.resolveToken(inputSymbol),
			this.resolveToken(outputSymbol),
		])
		const path: string[] = [input.address, output.address]
		const amountIn = ethers.parseUnits(amountInFormatted, input.decimals)
		const amountsOut: bigint[] = await this.router.getAmountsOut(amountIn, path)
		const quotedOut: bigint = amountsOut[amountsOut.length - 1]
		const amountOutMin =
			(quotedOut * BigInt(10_000 - slippageBps)) / BigInt(10_000)
		const deadline = Math.floor(Date.now() / 1000) + 60 * 20

		if (typeof window === "undefined" || !window.ethereum) {
			throw new Error("Wallet provider not available")
		}

		const browserProvider = new ethers.BrowserProvider(window.ethereum)
		const signer = await browserProvider.getSigner()
		const routerWithSigner = new ethers.Contract(
			config.icecreamSwapV2Router,
			V2_ROUTER_ABI,
			signer,
		)

		const isInputNative = inputSymbol === "NEON"
		const isOutputNative = outputSymbol === "NEON"

		// Approve if input is ERC20
		if (!isInputNative) {
			const inputErc20 = new ethers.Contract(
				input.address,
				[...ERC20_READ_ABI, ...ERC20_WRITE_ABI],
				signer,
			)
			const owner = await signer.getAddress()
			const currentAllowance: bigint = await inputErc20.allowance(
				owner,
				config.icecreamSwapV2Router,
			)
			if (currentAllowance < amountIn) {
				const approveTx = await inputErc20.approve(
					config.icecreamSwapV2Router,
					amountIn,
				)
				await approveTx.wait()
			}
		}

		let tx: ethers.TransactionResponse
		if (isInputNative) {
			// Native -> Token
			tx = await routerWithSigner.swapExactETHForTokens(
				amountOutMin,
				path,
				recipient,
				deadline,
				{ value: amountIn },
			)
		} else if (isOutputNative) {
			// Token -> Native
			tx = await routerWithSigner.swapExactTokensForETH(
				amountIn,
				amountOutMin,
				path,
				recipient,
				deadline,
			)
		} else {
			// Token -> Token
			tx = await routerWithSigner.swapExactTokensForTokens(
				amountIn,
				amountOutMin,
				path,
				recipient,
				deadline,
			)
		}

		return { txHash: tx.hash }
	}
}
