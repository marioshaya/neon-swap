"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { CgArrowsExchangeAltV } from "react-icons/cg"
import { FaAngleDown } from "react-icons/fa6"
import ConnectWallet from "@/components/ConnectWallet"
import TokenSelector from "@/components/TokenSelector"
import type { SelectTokensState, TxState } from "@/types"

export default function Home() {
	const [status, setStatus] = useState<TxState>("pending")
	const [statusOpen, setStatusOpen] = useState(false)
	const [statusMessage, setStatusMessage] = useState<string | undefined>()
	const [txHash, setTxHash] = useState<string | null>(null)
	const [connectedAccount, setConnectedAccount] = useState<string | null>(null)

	// Modals
	const [isInputTokenSelectorOpen, setIsInputTokenSelectorOpen] =
		useState(false)
	const [isOutputTokenSelectorOpen, setIsOutputTokenSelectorOpen] =
		useState(false)

	// Input & Output Tokens
	const [selectedInputToken, setSelectedInputToken] =
		useState<SelectTokensState>("NEON")
	const [selectedOutputToken, setSelectedOutputToken] =
		useState<SelectTokensState>("USDC")

	const openStatus = (s: typeof status, msg?: string, hash?: string | null) => {
		setStatus(s)
		setStatusMessage(msg)
		if (typeof hash !== "undefined") setTxHash(hash)
		setStatusOpen(true)
	}

	const checkConnection = useCallback(async () => {
		if (typeof window === "undefined" || !window.ethereum) return

		try {
			const accounts = (await window.ethereum.request({
				method: "eth_accounts",
			})) as string[]

			if (accounts && accounts.length > 0) {
				setConnectedAccount(accounts[0])
			}
		} catch (err) {
			console.error("Error checking connection:", err)
		}
	}, [])

	const handleWalletConnect = async () => {
		try {
			// Already connected, disconnect
			if (connectedAccount) {
				setConnectedAccount(null)
				return
			}

			// MM installed?
			if (typeof window === "undefined" || !window.ethereum) {
				openStatus(
					"install_required",
					"MetaMask is not installed. Please install MetaMask to continue.",
				)
				return
			}

			openStatus("pending", "Connecting MetaMask…")
			const accounts = (await window.ethereum.request({
				method: "eth_requestAccounts",
			})) as string[]

			if (!accounts || accounts.length === 0) {
				openStatus("cancelled", "No account connected")
				return
			}

			setConnectedAccount(accounts[0])
			openStatus("success", "Wallet connected successfully")
		} catch (err: unknown) {
			console.error("Wallet connection error:", err)
			const message =
				err instanceof Error
					? err.message
					: typeof err === "object" && err !== null && "message" in err
						? String((err as { message: unknown }).message)
						: "Error occurred while connecting to MetaMask"
			const maybeCode = err as { code?: number }
			if (maybeCode?.code === 4001) {
				openStatus("cancelled", "You refused to connect MetaMask.")
			} else {
				openStatus("error", message)
			}
		}
	}

	// Check if already connected on mount
	useEffect(() => {
		checkConnection()
	}, [checkConnection])

	// Listen for account changes
	useEffect(() => {
		if (typeof window === "undefined" || !window.ethereum) return

		const handleAccountsChanged = (...args: unknown[]) => {
			const accounts = args[0] as string[]
			if (accounts.length === 0) {
				setConnectedAccount(null)
			} else {
				setConnectedAccount(accounts[0])
			}
		}

		const handleChainChanged = () => {
			// Reload on chain change to ensure everything is in sync
			window.location.reload()
		}

		window.ethereum.on("accountsChanged", handleAccountsChanged)
		window.ethereum.on("chainChanged", handleChainChanged)

		return () => {
			window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
			window.ethereum?.removeListener("chainChanged", handleChainChanged)
		}
	}, [])

	const handleInputTokenSelectorModal = () => {
		setIsInputTokenSelectorOpen(true)
	}
	const handleOutputTokenSelectorModal = () => {
		setIsOutputTokenSelectorOpen(true)
	}

	const handleInputTokenSelect = (token: SelectTokensState) => {
		setIsInputTokenSelectorOpen(false)
		setSelectedInputToken(token)
	}
	const handleOutputTokenSelect = (token: SelectTokensState) => {
		setIsOutputTokenSelectorOpen(false)
		setSelectedOutputToken(token)
	}

	return (
		<main className="bg-gray-200 dark:bg-gray-800 px-4 py-4 min-h-screen">
			<div className="mx-auto max-w-[90%] space-y-4 lg:max-w-7xl">
				<div className="flex items-center justify-between">
					<div className="font-semibold text-cyan-600 text-2xl">Neon Swap</div>
					<ConnectWallet
						connectedAccount={connectedAccount}
						onClick={handleWalletConnect}
					/>
				</div>
				<div className="w-full flex items-center justify-center flex-col bg-white dark:bg-black/20 border-2 border-cyan-600 rounded-2xl shadow-xl py-4 px-4">
					<div className="w-full flex items-center gap-x-4">
						<input
							className="w-full outline-2 outline-cyan-600 bg-gray-200/75 rounded-lg px-2 py-1"
							type="number"
						/>
						<button
							className="flex px-2 py-1 rounded-lg items-center bg-cyan-700 border border-cyan-600 text-white/95 font-bold gap-x-1"
							onClick={handleInputTokenSelectorModal}
							type="button"
						>
							<div>{selectedInputToken}</div>
							<div className="w-full h-full ">
								<FaAngleDown className="text-xl" />
							</div>
						</button>
					</div>
					<div className="w-full flex justify-center py-2">
						<button type="button" className="text-cyan-500 text-2xl">
							<CgArrowsExchangeAltV />
						</button>
					</div>
					<div className="w-full flex items-center gap-x-4">
						<input
							className="w-full outline-2 outline-cyan-600 bg-gray-200/75 rounded-lg px-2 py-1"
							type="number"
						/>
						<button
							className="flex px-2 py-1 rounded-lg items-center bg-cyan-700 border border-cyan-700 text-white/95 font-bold gap-x-1"
							onClick={handleOutputTokenSelectorModal}
							type="button"
						>
							<div>{selectedOutputToken}</div>
							<div className="w-full h-full ">
								<FaAngleDown className="text-xl" />
							</div>
						</button>
					</div>
					<button
						className="text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed bg-cyan-800 border-2 border-cyan-600 w-full py-2 rounded-lg mt-6"
						disabled={!connectedAccount}
						type="button"
					>
						Swap
					</button>
				</div>
				{statusOpen && (
					<div className="">
						{statusMessage && <div>{statusMessage}</div>}
						<Link
							href={`https://neon.blockscout.com/tx/${txHash}?tab=token_transfers`}
						>
							{txHash}
						</Link>
					</div>
				)}
				{isInputTokenSelectorOpen && (
					<TokenSelector
						isInput
						onClose={() => setIsInputTokenSelectorOpen(false)}
						onSelect={handleInputTokenSelect}
					/>
				)}
				{isOutputTokenSelectorOpen && (
					<TokenSelector
						onClose={() => setIsOutputTokenSelectorOpen(false)}
						onSelect={handleOutputTokenSelect}
					/>
				)}
			</div>
		</main>
	)
}
