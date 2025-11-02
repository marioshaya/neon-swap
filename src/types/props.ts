import type { SelectTokensState } from "./tokens"

export interface TokenSelectorProps {
	connectedWallet: string
	isInput?: boolean
	onClose: () => void
	onSelect: (tkn: SelectTokensState) => void
}
