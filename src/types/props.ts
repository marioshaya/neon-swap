import type { SelectTokensState } from "./tokens"

export interface TokenSelectorProps {
	connectedWallet: string
	disabled: string
	isInput?: boolean
	onClose: () => void
	onSelect: (tkn: SelectTokensState) => void
}
