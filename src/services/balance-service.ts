import { ethers } from "ethers"
import { config } from "@/config"
import { neonTokens } from "@/tokens"
import type { NeonBalanceResponse } from "@/types/balance"

const ERC20_ABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function symbol() view returns (string)",
]

export class BalanceService {
	private provider: ethers.JsonRpcProvider

	constructor() {
		this.provider = new ethers.JsonRpcProvider(config.rpc)
	}

	async getNeonBalance(walletAddress: string): Promise<NeonBalanceResponse> {
		try {
			// Native NEON balance with timeout
			const balance = await Promise.race([
				this.provider.getBalance(walletAddress),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Request timeout")), 10_000),
				),
			])

			const formattedBalance = ethers.formatEther(balance)

			return {
				wallet: walletAddress,
				token: "NEON",
				balance: balance.toString(),
				formattedBalance,
				decimals: 18,
				symbol: "NEON",
				chain: config.name,
				timestamp: Date.now(),
			}
		} catch (error) {
			console.error(error)

			return {
				wallet: walletAddress,
				token: "NEON",
				balance: "0",
				formattedBalance: "0",
				decimals: 18,
				symbol: "NEON",
				chain: config.name,
				timestamp: Date.now(),
			}
		}
	}

	async getUsdcBalance(walletAddress: string): Promise<NeonBalanceResponse> {
		try {
			const usdcContract = new ethers.Contract(
				neonTokens[1].contractAddress,
				ERC20_ABI,
				this.provider,
			)

			const [balance, decimals] = await Promise.all([
				usdcContract.balanceOf(walletAddress),
				usdcContract.decimals(),
			])

			const formattedBalance = ethers.formatUnits(balance, decimals)

			return {
				wallet: walletAddress,
				token: "USDC",
				balance: balance.toString(),
				formattedBalance,
				decimals: 6,
				symbol: "USDC",
				chain: config.name,
				timestamp: Date.now(),
			}
		} catch (error) {
			console.error(error)

			return {
				wallet: walletAddress,
				token: "USDC",
				balance: "0",
				formattedBalance: "0",
				decimals: 6,
				symbol: "USDC",
				chain: config.name,
				timestamp: Date.now(),
			}
		}
	}

	async getUsdtBalance(walletAddress: string): Promise<NeonBalanceResponse> {
		try {
			const usdcContract = new ethers.Contract(
				neonTokens[2].contractAddress,
				ERC20_ABI,
				this.provider,
			)

			const [balance, decimals] = await Promise.all([
				usdcContract.balanceOf(walletAddress),
				usdcContract.decimals(),
			])

			const formattedBalance = ethers.formatUnits(balance, decimals)

			return {
				wallet: walletAddress,
				token: "USDT",
				balance: balance.toString(),
				formattedBalance,
				decimals: 6,
				symbol: "USDT",
				chain: config.name,
				timestamp: Date.now(),
			}
		} catch (error) {
			console.error(error)

			return {
				wallet: walletAddress,
				token: "USDT",
				balance: "0",
				formattedBalance: "0",
				decimals: 6,
				symbol: "USDT",
				chain: config.name,
				timestamp: Date.now(),
			}
		}
	}
}
