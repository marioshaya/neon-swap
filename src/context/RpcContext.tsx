"use client"

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import { config } from "@/config"

type RpcContextValue = {
	rpcIndex: number
	rpcUrl: string
	setRpcIndex: (idx: number) => void
}

const RpcContext = createContext<RpcContextValue | undefined>(undefined)

const RPC_COOKIE_NAME = "rpc_index"

function readInitialIndex(): number {
	if (typeof window === "undefined") return 0
	// Try cookie first
	const cookieMatch = document.cookie.match(
		new RegExp(`${RPC_COOKIE_NAME}=([^;]+)`),
	)
	// biome-ignore lint/complexity/useOptionalChain: Low level
	if (cookieMatch && cookieMatch[1]) {
		const idx = Number(cookieMatch[1])
		if (!Number.isNaN(idx) && idx >= 0 && idx < config.rpc.length) return idx
	}
	// Fallback to localStorage
	try {
		const stored = window.localStorage.getItem(RPC_COOKIE_NAME)
		if (stored !== null) {
			const idx = Number(stored)
			if (!Number.isNaN(idx) && idx >= 0 && idx < config.rpc.length) return idx
		}
	} catch {}
	return 0
}

export function RpcProvider({ children }: { children: React.ReactNode }) {
	const [rpcIndex, setRpcIndexState] = useState<number>(0)

	useEffect(() => {
		setRpcIndexState(readInitialIndex())
	}, [])

	const setRpcIndex = useCallback((idx: number) => {
		if (idx < 0 || idx >= config.rpc.length) return
		setRpcIndexState(idx)
		try {
			window.localStorage.setItem(RPC_COOKIE_NAME, String(idx))
		} catch {}
		// Also set cookie for server-side API routes to read
		const maxAge = 60 * 60 * 24 * 30 // 30 days
		// biome-ignore lint/suspicious/noDocumentCookie: Low level
		document.cookie = `${RPC_COOKIE_NAME}=${idx}; path=/; max-age=${maxAge}`
	}, [])

	const value = useMemo<RpcContextValue>(
		() => ({
			rpcIndex,
			rpcUrl: config.rpc[rpcIndex] ?? config.rpc[0],
			setRpcIndex,
		}),
		[rpcIndex, setRpcIndex],
	)

	return <RpcContext.Provider value={value}>{children}</RpcContext.Provider>
}

export function useRpc() {
	const ctx = useContext(RpcContext)
	if (!ctx) throw new Error("useRpc must be used within RpcProvider")
	return ctx
}
