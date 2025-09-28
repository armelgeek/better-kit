import { SVGProps } from "react";
import { cn } from "@/lib/utils";

export const Logo = (props: SVGProps<any>) => {
	return (
		<svg
			width="64"
			height="64"
			viewBox="0 0 64 64"
			fill="none"
			className={cn("w-6 h-6", props.className)}
			aria-hidden={props['aria-hidden'] ?? false}
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>Better Query</title>
			<desc>Monogram logo combining a bold B and a magnifier Q</desc>
			<defs>
				<linearGradient id="bqGrad" x1="0" x2="1" y1="0" y2="1">
					<stop offset="0%" stopColor="#06b6d4" />
					<stop offset="100%" stopColor="#7c3aed" />
				</linearGradient>
			</defs>

			{/* Bold 'B' stem */}
			<rect x="6" y="8" width="10" height="48" rx="2" fill="url(#bqGrad)" className="dark:opacity-90" />

			{/* Upper bowl of B */}
			<path
				d="M16 12c6 0 12 4 12 10s-6 10-12 10"
				fill="none"
				stroke="url(#bqGrad)"
				strokeWidth="6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* Lower bowl of B */}
			<path
				d="M16 34c6 0 12 4 12 10s-6 10-12 10"
				fill="none"
				stroke="url(#bqGrad)"
				strokeWidth="6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>

			{/* Magnifier / Q: circle + handle overlapping B */}
			<g transform="translate(36,16)">
				<circle cx="0" cy="0" r="12" fill="none" stroke="url(#bqGrad)" strokeWidth="5" />
				<line x1="8.5" y1="8.5" x2="16" y2="16" stroke="url(#bqGrad)" strokeWidth="4" strokeLinecap="round" />
				{/* small tail to evoke 'Q' */}
				<path d="M-3 9 L2 14" stroke="url(#bqGrad)" strokeWidth="3" strokeLinecap="round" />
			</g>

			{/* Invisible rect for better click/tap target if used as interactive element */}
			<rect x="0" y="0" width="64" height="64" fill="transparent" />
		</svg>
	);
};
