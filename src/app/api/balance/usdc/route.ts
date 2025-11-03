import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { config } from "@/config"
import { BalanceService } from "@/services/balance-service"

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const walletAddress = searchParams.get("wallet")

	if (!walletAddress) {
		return NextResponse.json(
			{ error: "Wallet address is required" },
			{ status: 400 },
		)
	}

	// Validate Ethereum address format
	if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
		return NextResponse.json(
			{ error: "Invalid wallet address format" },
			{ status: 400 },
		)
	}

	try {
		const cookieStore = await cookies()
		const rpcCookie = cookieStore.get("rpc_index")?.value
		const preferredIdx = Number(rpcCookie)
		const startIdx =
			!Number.isNaN(preferredIdx) &&
			preferredIdx >= 0 &&
			preferredIdx < config.rpc.length
				? preferredIdx
				: 0

		let lastError: unknown = null
		for (let i = 0; i < config.rpc.length; i++) {
			const idx = (startIdx + i) % config.rpc.length
			try {
				const rpcUrl = config.rpc[idx]
				const service = new BalanceService(rpcUrl)
				const result = await service.getUsdcBalance(walletAddress)
				return NextResponse.json(result, { status: 200 })
			} catch (err) {
				lastError = err
			}
		}

		throw lastError ?? new Error("All RPCs failed")
	} catch (error) {
		console.error("Error fetching USDC balance:", error)
		return NextResponse.json(
			{ error: "Failed to fetch balance" },
			{ status: 500 },
		)
	}
}
