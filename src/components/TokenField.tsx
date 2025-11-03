import { FaAngleDown } from "react-icons/fa6"

interface props {
	amount: string
	token: string
	onChange?: React.ChangeEventHandler<HTMLInputElement>
	onClick: () => void
	isOutput?: boolean
}

const TokenField = ({ amount, isOutput, onChange, onClick, token }: props) => {
	return (
		<div className="w-full flex items-center gap-x-4">
			<input
				className="w-full outline-2 outline-cyan-600 bg-gray-200/75 rounded-lg px-2 py-1 dark:bg-gray-200/15"
				type="number"
				value={amount}
				// onChange={(e) => setInputAmount(e.target.value)}
				onChange={onChange}
				readOnly={isOutput}
			/>
			<button
				className="flex px-2 py-1 rounded-lg items-center bg-cyan-700 border border-cyan-600 text-white/95 font-bold gap-x-1"
				onClick={onClick}
				type="button"
			>
				<div>{token}</div>
				<div className="w-full h-full ">
					<FaAngleDown className="text-xl" />
				</div>
			</button>
		</div>
	)
}

export default TokenField
