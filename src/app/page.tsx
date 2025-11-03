"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CgArrowsExchangeAltV } from "react-icons/cg"
import { FaTimes } from "react-icons/fa"
import { FaCircleNotch } from "react-icons/fa6"
import { IoReloadOutline } from "react-icons/io5"
import ConnectWallet from "@/components/ConnectWallet"
import RpcSelector from "@/components/RpcSelector"
import TokenField from "@/components/TokenField"
import TokenSelector from "@/components/TokenSelector"
import { config } from "@/config"
import { useRpc } from "@/context/RpcContext"
import { useBalance } from "@/hooks"
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

	// Quote loading state
	const [quoteLoading, setQuoteLoading] = useState(false)

	// Balance
	const { balance, loading, refetchBalance } = useBalance(
		connectedAccount ?? "",
	)

	// Rpc
	const { rpcUrl } = useRpc()
	const swapService = useMemo(() => new SwapService(rpcUrl), [rpcUrl])

	const refetchQuote = useCallback(async () => {
		if (!inputAmount && !outputAmount) return

		setQuoteLoading(true)
		try {
			if (lastEdited === "input" && inputAmount && Number(inputAmount) > 0) {
				const quote = await swapService.getQuote({
					inputSymbol: selectedInputToken,
					outputSymbol: selectedOutputToken,
					amountIn: inputAmount,
				})
				setOutputAmount(quote?.amountOutFormatted ?? "")
			} else if (
				lastEdited === "output" &&
				outputAmount &&
				Number(outputAmount) > 0
			) {
				const quote = await swapService.getQuoteForOutput({
					inputSymbol: selectedInputToken,
					outputSymbol: selectedOutputToken,
					amountOut: outputAmount,
				})
				setInputAmount(quote?.amountInFormatted ?? "")
			} else if (inputAmount && Number(inputAmount) > 0) {
				// Default: refetch forward quote if input amount exists
				const quote = await swapService.getQuote({
					inputSymbol: selectedInputToken,
					outputSymbol: selectedOutputToken,
					amountIn: inputAmount,
				})
				setOutputAmount(quote?.amountOutFormatted ?? "")
			}
		} catch (err) {
			console.error("Error refetching quote:", err)
		} finally {
			setQuoteLoading(false)
		}
	}, [
		inputAmount,
		outputAmount,
		lastEdited,
		selectedInputToken,
		selectedOutputToken,
		swapService,
	])

	const handleRefetchBalance = useCallback(async () => {
		if (refetchBalance) {
			await refetchBalance().catch((err) => {
				console.error("Error refetching balance:", err)
			})
		}
		// Refetch quote after balance is refetched
		await refetchQuote()
	}, [refetchBalance, refetchQuote])

	const isLoading = loading || quoteLoading

	const getTokenBalance = (tkn: SelectTokensState) => {
		switch (tkn) {
			case "NEON":
				return balance.neon
			case "USDC":
				return balance.usdc
			case "USDTi":
				return balance.usdt
		}
	}

	const isBalanceSufficient =
		getTokenBalance(selectedInputToken) > Number(inputAmount)

	const openStatus = useCallback(
		(s: typeof status, msg?: string, hash?: string | null) => {
			setStatus(s)
			setStatusMessage(msg)
			if (typeof hash !== "undefined") setTxHash(hash)
			setStatusOpen(true)
		},
		[],
	)

	const handleSwap = useCallback(async () => {
		try {
			if (!connectedAccount) return
			if (typeof window === "undefined" || !window.ethereum) {
				openStatus(
					"install_required",
					"MetaMask is not installed. Please install MetaMask to continue.",
				)
				return
			}

			openStatus("pending", "Submitting swap transaction…")

			const browserProvider = new (
				await import("ethers")
			).ethers.BrowserProvider(window.ethereum)
			const network = await browserProvider.getNetwork()
			if (Number(network.chainId) !== config.chainId) {
				openStatus(
					"wrong_network",
					`Please switch network to ${config.name} (chainId ${config.chainId}).`,
				)
				return
			}

			const { txHash } = await swapService.swapExactInput({
				inputSymbol: selectedInputToken,
				outputSymbol: selectedOutputToken,
				amountInFormatted: inputAmount,
				recipient: connectedAccount,
				slippageBps: 50,
			})

			openStatus("success", "Swap transaction submitted successfully", txHash)
		} catch (err: unknown) {
			console.error("Swap error:", err)
			const message =
				err instanceof Error
					? err.message
					: typeof err === "object" && err !== null && "message" in err
						? String((err as { message: unknown }).message)
						: "Error occurred while swapping"
			const maybeCode = err as { code?: number }
			if (maybeCode?.code === 4001) {
				openStatus("cancelled", "You rejected the transaction.")
			} else {
				openStatus("error", message)
			}
		}
	}, [
		connectedAccount,
		inputAmount,
		selectedInputToken,
		selectedOutputToken,
		swapService,
		openStatus,
	])

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
				<div className="w-full flex items-end justify-center flex-col bg-white dark:bg-black/20 border-2 border-cyan-600 rounded-2xl shadow-xl py-4 px-4">
					<div className="">
						<button
							className="text-cyan-600 text-2xl hover:text-cyan-700 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								handleRefetchBalance()
							}}
							type="button"
							disabled={!connectedAccount || isLoading}
						>
							{isLoading ? (
								<FaCircleNotch className="animate-spin" />
							) : (
								<IoReloadOutline />
							)}
						</button>
					</div>
					<TokenField
						amount={inputAmount}
						connectedAccount={connectedAccount}
						loading={isLoading}
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
						loading={isLoading}
						onChange={(e) => {
							setLastEdited("output")
							setOutputAmount(e.target.value)
						}}
						onClick={handleOutputTokenSelectorModal}
						isOutput
						token={selectedOutputToken}
					/>
					{connectedAccount ? (
						<button
							className="text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed bg-cyan-800 border-2 border-cyan-600 w-full py-2 rounded-lg mt-6"
							disabled={
								!connectedAccount ||
								!selectedInputToken ||
								!selectedOutputToken ||
								!inputAmount ||
								!outputAmount ||
								!isBalanceSufficient
							}
							type="button"
							onClick={handleSwap}
						>
							{isBalanceSufficient ? "Swap" : "Insufficient balance"}
						</button>
					) : (
						<button
							className="text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed bg-cyan-800 border-2 border-cyan-600 w-full py-2 rounded-lg mt-6"
							onClick={handleWalletConnect}
							type="button"
						>
							Connect Wallet
						</button>
					)}
				</div>
				{statusOpen && (
					<div className="flex justify-between">
						{statusMessage && <div>{statusMessage}</div>}
						<Link
							href={`${config.scanExplorer}/${txHash}?tab=token_transfers`}
							target="_blank"
						>
							{txHash}
						</Link>
						<button onClick={() => setStatusOpen(false)} type="button">
							<FaTimes />
						</button>
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
