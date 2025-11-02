import { type NextRequest, NextResponse } from "next/server"
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
		const balanceService = new BalanceService()
		const result = await balanceService.getUsdcBalance(walletAddress)

		return NextResponse.json(result, { status: 200 })
	} catch (error) {
		console.error("Error fetching USDC balance:", error)
		return NextResponse.json(
			{ error: "Failed to fetch balance" },
			{ status: 500 },
		)
	}
}
