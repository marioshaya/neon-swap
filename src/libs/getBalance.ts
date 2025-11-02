const BALANCE_API_URL = "/api/balance"
export const getNeonBalance = async (address: string) => {
	try {
		const res = await fetch(`${BALANCE_API_URL}/neon?wallet=${address}`)
		if (!res.ok) return

		const balance = res.json()

		return balance
	} catch (err) {
		console.error("error: ", err)
	}
}
