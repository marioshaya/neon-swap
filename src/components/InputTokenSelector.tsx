import { FaTimes } from "react-icons/fa"
import { neonTokens } from "@/tokens"
import type { TokenSelectorProps } from "@/types"
import { formatAddress } from "@/utils"

const InputTokenSelector = ({ onSelect, onClose }: TokenSelectorProps) => {
	return (
		<div className="absolute top-0 left-0 flex flex-col items-center justify-center p-4 backdrop-blur-lg h-screen w-full bg-cyan-700/5">
			<div className="bg-cyan-700 p-4 w-4/5 rounded-3xl">
				<div className="flex items-center justify-between">
					<div className="text-lg font-bold">Input Token Selector</div>
					<button type="button" onClick={onClose}>
						<FaTimes className="text-2xl hover:bg-red-700/75" />
					</button>
				</div>
				<div className="flex flex-col gap-4">
					{neonTokens.map((tkn) => (
						<button
							className="border-b flex items-center justify-between"
							onClick={() => onSelect(tkn.name)}
							key={tkn.contractAddress}
							type="button"
						>
							<div>
								<div>{tkn.name}</div>
								<div className="text-white/55">
									{formatAddress(tkn.contractAddress)}
								</div>
							</div>
							<div>120</div>
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

export default InputTokenSelector
