import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { RpcProvider } from "@/context/RpcContext"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "Neon Swap",
	description: "Mini DEX for Neon EVM Chain internal swap",
	authors: {
		name: "Mario SHAYA",
		url: "https://github.com/marioshaya",
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<RpcProvider>{children}</RpcProvider>
			</body>
		</html>
	)
}
