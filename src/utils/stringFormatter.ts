export const formatAddress = (address: string | null): string => {
	if (!address) return ""
	return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatBalance = (balance: number) => {
	if (Number(balance) === 0) {
		return 0
	}
	return Number(balance).toFixed(4)
}
