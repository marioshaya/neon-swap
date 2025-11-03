"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CgArrowsExchangeAltV } from "react-icons/cg"
import ConnectWallet from "@/components/ConnectWallet"
import RpcSelector from "@/components/RpcSelector"
import TokenField from "@/components/TokenField"
import TokenSelector from "@/components/TokenSelector"
import { useRpc } from "@/context/RpcContext"
import { SwapService } from "@/services/swap-service"
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

	// Amounts
	const [inputAmount, setInputAmount] = useState<string>("")
	const [outputAmount, setOutputAmount] = useState<string>("")
	const [lastEdited, setLastEdited] = useState<"input" | "output" | null>(null)
	const { rpcUrl } = useRpc()
	const swapService = useMemo(() => new SwapService(rpcUrl), [rpcUrl])

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

	const handleSwitchTokens = () => {
		setSelectedInputToken((prevIn) => {
			const newIn = selectedOutputToken
			setSelectedOutputToken(prevIn)
			return newIn
		})
		// Swap amounts so the previous quote becomes the new input
		setInputAmount((prevInAmt) => {
			const newInAmt = outputAmount
			setOutputAmount(prevInAmt)
			return newInAmt
		})
	}

	useEffect(() => {
		let cancelled = false
		async function fetchQuote() {
			const quote = await swapService.getQuote({
				inputSymbol: selectedInputToken,
				outputSymbol: selectedOutputToken,
				amountIn: inputAmount || "0",
			})
			if (cancelled) return
			setOutputAmount(quote?.amountOutFormatted ?? "")
		}
		if (lastEdited === "input" && inputAmount && Number(inputAmount) > 0) {
			fetchQuote().catch(() => {})
		} else {
			if (lastEdited === "input") setOutputAmount("")
		}
		return () => {
			cancelled = true
		}
	}, [
		inputAmount,
		selectedInputToken,
		selectedOutputToken,
		swapService,
		lastEdited,
	])

	useEffect(() => {
		let cancelled = false
		async function fetchReverseQuote() {
			const quote = await swapService.getQuoteForOutput({
				inputSymbol: selectedInputToken,
				outputSymbol: selectedOutputToken,
				amountOut: outputAmount || "0",
			})
			if (cancelled) return
			setInputAmount(quote?.amountInFormatted ?? "")
		}
		if (lastEdited === "output" && outputAmount && Number(outputAmount) > 0) {
			fetchReverseQuote().catch(() => {})
		} else {
			if (lastEdited === "output") setInputAmount("")
		}
		return () => {
			cancelled = true
		}
	}, [
		outputAmount,
		selectedInputToken,
		selectedOutputToken,
		swapService,
		lastEdited,
	])

	return (
		<main className="bg-gray-200 dark:bg-gray-800 px-4 py-4 min-h-screen">
			<div className="mx-auto max-w-[90%] space-y-4 lg:max-w-7xl">
				<div className="flex items-center justify-between">
					<div className="font-semibold text-cyan-600 text-2xl">Neon Swap</div>
					<div className="flex items-center gap-x-4">
						<RpcSelector />
						<ConnectWallet
							connectedAccount={connectedAccount}
							onClick={handleWalletConnect}
						/>
					</div>
				</div>
				<div className="w-full flex items-center justify-center flex-col bg-white dark:bg-black/20 border-2 border-cyan-600 rounded-2xl shadow-xl py-4 px-4">
					<TokenField
						amount={inputAmount}
						connectedAccount={connectedAccount}
						onChange={(e) => {
							setLastEdited("input")
							setInputAmount(e.target.value)
						}}
						onClick={handleInputTokenSelectorModal}
						token={selectedInputToken}
					/>
					<div className="w-full flex justify-center py-2">
						<button
							type="button"
							className="text-cyan-500 text-2xl"
							onClick={handleSwitchTokens}
						>
							<CgArrowsExchangeAltV />
						</button>
					</div>
					<TokenField
						amount={outputAmount}
						connectedAccount={connectedAccount}
						onChange={(e) => {
							setLastEdited("output")
							setOutputAmount(e.target.value)
						}}
						onClick={handleOutputTokenSelectorModal}
						isOutput
						token={selectedOutputToken}
					/>
					<button
						className="text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed bg-cyan-800 border-2 border-cyan-600 w-full py-2 rounded-lg mt-6"
						disabled={
							!connectedAccount ||
							!selectedInputToken ||
							!selectedOutputToken ||
							!inputAmount ||
							!outputAmount
						}
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
				{isInputTokenSelectorOpen && connectedAccount && (
					<TokenSelector
						connectedWallet={connectedAccount}
						disabled={selectedOutputToken}
						isInput
						onClose={() => setIsInputTokenSelectorOpen(false)}
						onSelect={handleInputTokenSelect}
					/>
				)}
				{isOutputTokenSelectorOpen && connectedAccount && (
					<TokenSelector
						connectedWallet={connectedAccount}
						disabled={selectedInputToken}
						onClose={() => setIsOutputTokenSelectorOpen(false)}
						onSelect={handleOutputTokenSelect}
					/>
				)}
			</div>
		</main>
	)
}
