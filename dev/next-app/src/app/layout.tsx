import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "BETTER QUERY HOME - Next.js App",
	description:
		"Comprehensive BETTER QUERY HOME showcasing all features and capabilities",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="font-sans">{children}</body>
		</html>
	);
}
