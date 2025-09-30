import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Better Admin - Admin Panel",
	description: "Admin panel built with Better Admin",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
