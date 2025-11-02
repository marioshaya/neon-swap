"use client"

import { FaTimes } from "react-icons/fa"
import { FaCircleNotch } from "react-icons/fa6"
import { useBalance } from "@/hooks"
import { neonTokens } from "@/tokens"
import type { TokenSelectorProps } from "@/types"
import { formatBalance } from "@/utils"

const TokenSelector = ({
	connectedWallet,
	disabled,
	isInput,
	onSelect,
	onClose,
}: TokenSelectorProps) => {
	const { balance, loading, error } = useBalance(connectedWallet)

	return (
		<div className="absolute top-0 left-0 flex flex-col items-center justify-center p-4 backdrop-blur-lg h-screen w-full bg-cyan-700/5">
			<div className="bg-cyan-700 w-4/5 rounded-3xl overflow-hidden">
				<div className="flex items-center justify-between p-4">
					<div className="text-lg font-bold">
						{isInput ? "Input" : "Output"} Token Selector
					</div>
					<button type="button" onClick={onClose}>
						<FaTimes className="text-2xl hover:text-red-400/75 transition-colors duration-300 ease-in-out" />
					</button>
				</div>
				<div className="flex flex-col bg-cyan-900">
					{neonTokens.map((tkn) => (
						<button
							className="flex items-center justify-between px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-cyan-800 ease-in-out transition-all duration-300"
							disabled={tkn.name === disabled}
							onClick={() => onSelect(tkn.name)}
							key={tkn.contractAddress}
							type="button"
						>
							<div>{tkn.name}</div>
							<div>
								{connectedWallet ? (
									loading ? (
										<FaCircleNotch className="animate-spin" />
									) : balance ? (
										<span>
											{tkn.name === "NEON"
												? formatBalance(balance.neon)
												: tkn.name === "USDC"
													? formatBalance(balance.usdc)
													: formatBalance(balance.usdt)}
										</span>
									) : (
										<span>{error}</span>
									)
								) : (
									0
								)}
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

export default TokenSelector
