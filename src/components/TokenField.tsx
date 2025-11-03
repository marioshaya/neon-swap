import { FaAngleDown } from "react-icons/fa6"

interface props {
	amount: string
	token: string
	onChange?: React.ChangeEventHandler<HTMLInputElement>
	onClick: () => void
	isOutput?: boolean
}

const TokenField = ({ amount, isOutput, onChange, onClick, token }: props) => {
	const handleInput: React.FormEventHandler<HTMLInputElement> = (e) => {
		if (isOutput) return
		const inputEl = e.currentTarget
		const raw = inputEl.value
		// Allow only digits and a single optional dot
		const sanitized = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
		if (sanitized !== raw) {
			inputEl.value = sanitized
		}
		// Forward as change event with sanitized value
		onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>)
	}

	return (
		<div
			className={`w-full flex flex-col items-center gap-4 border-2 border-cyan-600 p-4 rounded-lg ${isOutput ? "bg-gray-700/25 dark:bg-gray-200/5" : "bg-gray-200/75 dark:bg-gray-200/15"}`}
		>
			<div className="w-full flex justify-between items-center">
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
				<div className="">32</div>
			</div>
			<input
				className={`w-full text-end py-1 font-bold text-xl ${isOutput ? "text-cyan-600" : "text-cyan-500"}`}
				type="text"
				inputMode="decimal"
				pattern="^\\d*\\.?\\d*$"
				value={amount}
				onInput={handleInput}
				placeholder="0.00"
				readOnly={isOutput}
			/>
		</div>
	)
}

export default TokenField
