import { useMemo, useState } from "react"
import { TbNetwork } from "react-icons/tb"
import { config } from "@/config"
import { useRpc } from "@/context/RpcContext"

const RpcSelector = () => {
	const [isDropdown, setIsDropdown] = useState(false)
	const { rpcIndex, setRpcIndex } = useRpc()

	const options = useMemo(
		() => [
			{ label: "Everstake", url: config.rpc[0] },
			{ label: "P2P.org", url: config.rpc[1] },
			{ label: "DRPC", url: config.rpc[2] },
		],
		[],
	)

	return (
		<div className="relative w-10">
			<button
				className="flex items-center justify-center gap-x-2 font-bold border w-full p-2 rounded-lg transition-colors text-cyan-600"
				onClick={() => setIsDropdown(!isDropdown)}
				type="button"
			>
				<TbNetwork />
			</button>
			{isDropdown && (
				<div className="flex flex-col gap-y-2 items-stretch min-w-40 absolute top-12 right-0 bg-white dark:bg-cyan-800/5 backdrop-blur-lg p-2 rounded-xl shadow border border-cyan-600">
					{options.map((opt, idx) => (
						<button
							key={opt.url}
							className={`text-left px-3 py-2 rounded-lg transition-colors ${idx === rpcIndex ? "bg-cyan-600 text-white" : "hover:bg-cyan-50 dark:hover:bg-cyan-900/30"}`}
							onClick={() => {
								setRpcIndex(idx)
								setIsDropdown(false)
							}}
							type="button"
						>
							<span className="block font-semibold">{opt.label}</span>
							<span className="block text-xs opacity-70 truncate">
								{opt.url}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	)
}

export default RpcSelector
