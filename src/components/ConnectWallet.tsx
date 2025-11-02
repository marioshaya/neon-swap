import { useState } from "react"
import { SlWallet } from "react-icons/sl"
import { formatAddress } from "@/utils"

interface ConnectWalletProps {
	onClick: () => void
	connectedAccount: string | null
}

const ConnectWallet = ({ connectedAccount, onClick }: ConnectWalletProps) => {
	const [isDropdown, setIsDropdown] = useState(false)

	const getAccount = (address: string) => {
		if (address === "0x17402d4689926a9ccc2f1e5e4e4ed3f7c4076663") {
			return "FatGirl"
		} else if (address === "0x94510b9f79c5d8af286bbf2e7880c7799588d19b") {
			return "SlimGirl"
		}
		return formatAddress(address)
	}

	return (
		<div className="relative w-10">
			<button
				className={`flex items-center justify-center gap-x-2 font-bold border w-full p-2 rounded-lg transition-colors ${
					connectedAccount
						? "text-cyan-600 bg-white dark:bg-black/20 border-cyan-600 hover:bg-cyan-50"
						: "text-white bg-cyan-600 border-cyan-600 hover:bg-cyan-700"
				}`}
				type="button"
				onClick={() => setIsDropdown(!isDropdown)}
			>
				<SlWallet className="text-xl" />
			</button>
			{isDropdown && (
				<div className="flex flex-col items-center w-42 absolute top-12 right-0 bg-white dark:bg-black/50 backdrop-blur-2xl p-2 rounded-xl">
					<div className="">
						{connectedAccount && getAccount(connectedAccount)}
					</div>
					<button
						className="w-full border rounded-lg text-cyan-600 border-cyan-600 px-2 py-1"
						type="button"
						onClick={onClick}
					>
						{connectedAccount ? "Disconnect" : "Connect"}
					</button>
				</div>
			)}
		</div>
	)
}

export default ConnectWallet
