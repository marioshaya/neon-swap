import type { SelectTokensState } from "./tokens"

export interface TokenSelectorProps {
	onClose: () => void
	onSelect: (tkn: SelectTokensState) => void
}
