"use client"

import { useEffect, useState } from "react"

export const useBalance = (addr: string) => {
	const [balance, setBalance] = useState({
		neon: 0,
		usdc: 0,
		usdt: 0,
	})

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only once
	useEffect(() => {
		const fetchBalances = async () => {
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
					neon: neonData,
					usdc: usdcData,
					usdt: usdtData,
				})
			} catch (err) {
				setError("Failed to fetch balances from Balance Fetcher API")
				console.error("Error fetching balances:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchBalances()
		const interval = setInterval(fetchBalances, 30_000)
		return () => clearInterval(interval)
	}, [])

	return { balance, loading, error }
}
