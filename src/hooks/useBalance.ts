"use client"

import { useCallback, useEffect, useState } from "react"

export const useBalance = (addr: string) => {
	const [balance, setBalance] = useState({
		neon: 0,
		usdc: 0,
		usdt: 0,
	})

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const refetchBalance = useCallback(async () => {
		// Guard: no address => reset and skip fetching
		if (!addr || addr.trim() === "") {
			setBalance({ neon: 0, usdc: 0, usdt: 0 })
			setLoading(false)
			setError(null)
			return
		}

		setLoading(true)
		setError(null)

		try {
			const baseURL = "/api/balance"

			const [neonRes, usdcRes, usdtRes] = await Promise.all([
				fetch(`${baseURL}/neon?wallet=${addr}`),
				fetch(`${baseURL}/usdc?wallet=${addr}`),
				fetch(`${baseURL}/usdt?wallet=${addr}`),
			])

			if (!neonRes.ok) throw new Error("Failed to fetch balances from API")

			const [neonData, usdcData, usdtData] = await Promise.all([
				neonRes.json(),
				usdcRes.json(),
				usdtRes.json(),
			])

			setBalance({
				neon: neonData.formattedBalance,
				usdc: usdcData.formattedBalance,
				usdt: usdtData.formattedBalance,
			})
		} catch (err) {
			setError("Failed to fetch balances from Balance Fetcher API")
			console.error("Error fetching balances:", err)
		} finally {
			setLoading(false)
		}
	}, [addr])

	useEffect(() => {
		refetchBalance()
		const interval = setInterval(refetchBalance, 30_000)
		return () => clearInterval(interval)
	}, [refetchBalance])

	return { balance, loading, error, refetchBalance }
}
