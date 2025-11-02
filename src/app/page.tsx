import { CgArrowsExchangeAltV } from "react-icons/cg"
import { FaAngleDown } from "react-icons/fa6"

export default function Home() {
	return (
		<div className="flex items-center bg-gray-200 justify-center gap-y-2 flex-col min-h-screen">
			<div className="font-semibold text-cyan-600 text-2xl">Neon Swap</div>
			<div className="min-h-96 bg-white border-2 border-cyan-600 rounded-2xl shadow-xl py-4 px-4 w-4/5">
				<div className="space-y-4">
					<div className="flex items-center gap-x-4">
						<input
							className="w-full outline-2 outline-cyan-600 bg-gray-200/75 rounded-lg px-2 py-1"
							type="number"
						/>
						<button
							className="flex px-2 py-1 rounded-lg items-center bg-cyan-600 text-white/95 font-bold gap-x-1"
							type="button"
						>
							<div>NEON</div>
							<div className="w-full h-full ">
								<FaAngleDown className="text-xl" />
							</div>
						</button>
					</div>
					<div className="w-full flex justify-center">
						<button type="button" className="text-cyan-500 text-2xl">
							<CgArrowsExchangeAltV />
						</button>
					</div>
					<div className="flex items-center gap-x-4">
						<input
							className="w-full outline-2 outline-cyan-600 bg-gray-200/75 rounded-lg px-2 py-1"
							type="number"
						/>
						<button
							className="flex px-2 py-1 rounded-lg items-center bg-cyan-600 text-white/95 font-bold gap-x-1"
							type="button"
						>
							<div>USDC</div>
							<div className="w-full h-full ">
								<FaAngleDown className="text-xl" />
							</div>
						</button>
					</div>
					<div className="">
						<button
							className="text-white font-bold bg-cyan-600 border border-cyan-600 w-full py-2 rounded-lg"
							type="button"
						>
							Connect Wallet
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
