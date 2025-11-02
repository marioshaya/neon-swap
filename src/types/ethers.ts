export type TxState =
	| "install_required"
	| "pending"
	| "cancelled"
	| "wrong_network"
	| "insufficient_balance"
	| "success"
	| "error"

export interface EthereumProvider {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>
	on(event: string, handler: (...args: unknown[]) => void): void
	removeListener(event: string, handler: (...args: unknown[]) => void): void
	isMetaMask?: boolean
	selectedAddress?: string | null
	chainId?: string
}

declare global {
	interface Window {
		ethereum?: EthereumProvider
	}
}
