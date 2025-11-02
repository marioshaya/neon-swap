import type { SelectTokensState } from "./tokens"

export interface TokenSelectorProps {
	isInput?: boolean
	onClose: () => void
	onSelect: (tkn: SelectTokensState) => void
}
