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
		const rpcCookie = cookies().get("rpc_index")?.value
		const idx = Number(rpcCookie)
		const rpcUrl =
			!Number.isNaN(idx) && idx >= 0 && idx < config.rpc.length
				? config.rpc[idx]
				: config.rpc[0]
		const balanceService = new BalanceService(rpcUrl)
		const result = await balanceService.getUsdtBalance(walletAddress)

		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error("Error fetching USDT balance:", error)
		return NextResponse.json(
			{ error: "Failed to fetch balance" },
			{ status: 500 },
		)
	}
}
