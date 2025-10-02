import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { Moon, PlusIcon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import CodeTabs from "./code-tabs";
import SignIn from "./sign-in";
import { SignUp } from "./sign-up";
import { socialProviders } from "./social-provider";
import { optionsAtom } from "./store";
import { AuthTabs } from "./tabs";
const frameworks = [
	{
		title: "Next.js",
		description: "The React Framework for Production",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="2em"
				height="2em"
				viewBox="0 0 15 15"
			>
				<path
					fill="currentColor"
					fillRule="evenodd"
					d="M0 7.5a7.5 7.5 0 1 1 11.698 6.216L4.906 4.21A.5.5 0 0 0 4 4.5V12h1V6.06l5.83 8.162A7.5 7.5 0 0 1 0 7.5M10 10V4h1v6z"
					clipRule="evenodd"
				></path>
			</svg>
		),
	},
	{
		title: "Nuxt",
		description: "The Intuitive Vue Framework",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="2em"
				height="2em"
				viewBox="0 0 256 256"
			>
				<g fill="none">
					<rect width="256" height="256" fill="#242938" rx="60"></rect>
					<path
						fill="#00DC82"
						d="M138.787 189.333h68.772c2.184.001 4.33-.569 6.222-1.652a12.4 12.4 0 0 0 4.554-4.515a12.24 12.24 0 0 0-.006-12.332l-46.185-79.286a12.4 12.4 0 0 0-4.553-4.514a12.53 12.53 0 0 0-12.442 0a12.4 12.4 0 0 0-4.553 4.514l-11.809 20.287l-23.09-39.67a12.4 12.4 0 0 0-4.555-4.513a12.54 12.54 0 0 0-12.444 0a12.4 12.4 0 0 0-4.555 4.513L36.67 170.834a12.24 12.24 0 0 0-.005 12.332a12.4 12.4 0 0 0 4.554 4.515a12.5 12.5 0 0 0 6.222 1.652h43.17c17.104 0 29.718-7.446 38.397-21.973l21.072-36.169l11.287-19.356l33.873 58.142h-45.16zm-48.88-19.376l-30.127-.007l45.16-77.518l22.533 38.759l-15.087 25.906c-5.764 9.426-12.312 12.86-22.48 12.86"
					></path>
				</g>
			</svg>
		),
	},
	{
		title: "SvelteKit",
		description: "Web development for the rest of us",
		Icon: () => (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="2em"
				height="2em"
				viewBox="0 0 256 256"
			>
				<g fill="none">
					<rect width="256" height="256" fill="#FF3E00" rx="60"></rect>
					<g clipPath="url(#skillIconsSvelte0)">
						<path
							fill="#fff"
							d="M193.034 61.797c-16.627-23.95-49.729-30.966-73.525-15.865L77.559 72.78c-11.44 7.17-19.372 18.915-21.66 32.186c-1.984 11.136-.306 22.576 5.033 32.492c-3.66 5.491-6.102 11.593-7.17 18c-2.44 13.576.764 27.61 8.696 38.745c16.78 23.95 49.728 30.966 73.525 15.865l41.949-26.695c11.441-7.17 19.373-18.915 21.661-32.187c1.983-11.135.305-22.576-5.034-32.491c3.661-5.492 6.102-11.593 7.17-18c2.593-13.729-.61-27.763-8.695-38.898"
						></path>
						<path
							fill="#FF3E00"
							d="M115.39 196.491a33.25 33.25 0 0 1-35.695-13.271c-4.881-6.712-6.712-15.101-5.34-23.339c.306-1.373.611-2.593.916-3.966l.763-2.44L78.169 155a55.6 55.6 0 0 0 16.475 8.237l1.525.458l-.152 1.525c-.153 2.136.458 4.424 1.678 6.255c2.441 3.508 6.712 5.186 10.83 4.118c.916-.305 1.831-.61 2.594-1.068l41.796-26.695c2.136-1.372 3.509-3.355 3.966-5.796s-.152-5.034-1.525-7.017c-2.441-3.509-6.712-5.034-10.831-3.966c-.915.305-1.83.61-2.593 1.068l-16.017 10.22c-2.593 1.678-5.491 2.898-8.542 3.661a33.25 33.25 0 0 1-35.695-13.271c-4.729-6.712-6.712-15.102-5.186-23.339c1.372-7.932 6.254-15.102 13.118-19.373l41.949-26.695c2.593-1.678 5.492-2.898 8.543-3.814a33.25 33.25 0 0 1 35.695 13.272c4.881 6.712 6.711 15.101 5.339 23.339c-.306 1.373-.611 2.593-1.068 3.966l-.763 2.44l-2.136-1.525a55.6 55.6 0 0 0-16.474-8.237l-1.526-.458l.153-1.525c.153-2.136-.458-4.424-1.678-6.255c-2.441-3.508-6.712-5.034-10.83-3.966c-.916.305-1.831.61-2.594 1.068l-41.796 26.695c-2.136 1.373-3.509 3.356-3.966 5.797s.152 5.034 1.525 7.017c2.441 3.508 6.712 5.033 10.831 3.966c.915-.305 1.83-.611 2.593-1.068l16.017-10.22c2.593-1.678 5.491-2.899 8.542-3.814a33.25 33.25 0 0 1 35.695 13.271c4.881 6.712 6.712 15.102 5.339 23.339c-1.373 7.932-6.254 15.102-13.119 19.373l-41.949 26.695c-2.593 1.678-5.491 2.898-8.542 3.813"
						></path>
					</g>
					<defs>
						<clipPath id="skillIconsSvelte0">
							<path fill="#fff" d="M53 38h149.644v180H53z"></path>
						</clipPath>
					</defs>
				</g>
			</svg>
		),
	},
	{
		title: "SolidStart",
		description: "Fine-grained reactivity goes fullstack",
		Icon: () => (
			<svg
				data-hk="00000010210"
				width="2em"
				height="2em"
				viewBox="0 0 500 500"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				role="presentation"
			>
				<path
					d="M233.205 430.856L304.742 425.279C304.742 425.279 329.208 421.295 343.569 397.659L293.041 385.443L233.205 430.856Z"
					fill="url(#paint0_linear_1_2)"
				></path>
				<path
					d="M134.278 263.278C113.003 264.341 73.6443 268.059 73.6443 268.059L245.173 392.614L284.265 402.44L343.569 397.925L170.977 273.105C170.977 273.105 157.148 263.278 137.203 263.278C136.139 263.278 135.342 263.278 134.278 263.278Z"
					fill="url(#paint1_linear_1_2)"
				></path>
				<path
					d="M355.536 238.58L429.2 234.065C429.2 234.065 454.464 230.348 468.825 206.977L416.435 193.964L355.536 238.58Z"
					fill="url(#paint2_linear_1_2)"
				></path>
				<path
					d="M251.289 68.6128C229.217 69.4095 188.795 72.5964 188.795 72.5964L367.503 200.072L407.926 210.429L469.09 206.712L289.318 78.9702C289.318 78.9702 274.426 68.6128 253.417 68.6128C252.885 68.6128 252.087 68.6128 251.289 68.6128Z"
					fill="url(#paint3_linear_1_2)"
				></path>
				<path
					d="M31.0946 295.679C30.8287 295.945 30.8287 296.21 30.8287 296.475L77.8993 330.469L202.623 420.764C228.95 439.62 264.586 431.653 282.67 402.44L187.465 333.921L110.077 277.62C100.504 270.715 89.8663 267.528 79.2289 267.528C60.6134 267.528 42.2639 277.354 31.0946 295.679Z"
					fill="url(#paint4_linear_1_2)"
				></path>
				<path
					d="M147.043 99.9505C147.043 100.216 146.776 100.482 146.511 100.747L195.442 135.538L244.374 170.062L325.751 227.957C353.142 247.345 389.841 239.642 407.925 210.695L358.461 175.374L308.997 140.318L228.153 82.6881C218.047 75.5177 206.611 72.0652 195.442 72.0652C176.561 72.3308 158.212 81.8915 147.043 99.9505Z"
					fill="url(#paint5_linear_1_2)"
				></path>
				<path
					d="M112.471 139.255L175.497 208.305C178.423 212.289 181.614 216.006 185.337 219.193L308.199 354.105L369.364 350.387C387.448 321.439 380.002 282.135 352.611 262.748L271.234 204.852L222.568 170.328L173.636 135.538L112.471 139.255Z"
					fill="url(#paint6_linear_1_2)"
				></path>
				<path
					d="M111.939 140.052C94.1213 168.734 101.567 207.509 128.427 226.629L209.005 283.994L258.735 319.049L308.199 354.105C326.283 325.158 318.836 285.852 291.445 266.465L112.471 139.255C112.471 139.521 112.204 139.787 111.939 140.052Z"
					fill="url(#paint7_linear_1_2)"
				></path>
				<defs>
					<linearGradient
						id="paint0_linear_1_2"
						x1="359.728"
						y1="56.8062"
						x2="265.623"
						y2="521.28"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#1593F5"></stop>
						<stop offset="1" stopColor="#0084CE"></stop>
					</linearGradient>
					<linearGradient
						id="paint1_linear_1_2"
						x1="350.496"
						y1="559.872"
						x2="-44.0802"
						y2="-73.2062"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#1593F5"></stop>
						<stop offset="1" stopColor="#0084CE"></stop>
					</linearGradient>
					<linearGradient
						id="paint2_linear_1_2"
						x1="610.25"
						y1="570.526"
						x2="372.635"
						y2="144.034"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="white"></stop>
						<stop offset="1" stopColor="#15ABFF"></stop>
					</linearGradient>
					<linearGradient
						id="paint3_linear_1_2"
						x1="188.808"
						y1="-180.608"
						x2="390.515"
						y2="281.703"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="white"></stop>
						<stop offset="1" stopColor="#79CFFF"></stop>
					</linearGradient>
					<linearGradient
						id="paint4_linear_1_2"
						x1="415.84"
						y1="-4.74684"
						x2="95.1922"
						y2="439.83"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#0057E5"></stop>
						<stop offset="1" stopColor="#0084CE"></stop>
					</linearGradient>
					<linearGradient
						id="paint5_linear_1_2"
						x1="343.141"
						y1="-21.5427"
						x2="242.301"
						y2="256.708"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="white"></stop>
						<stop offset="1" stopColor="#15ABFF"></stop>
					</linearGradient>
					<linearGradient
						id="paint6_linear_1_2"
						x1="469.095"
						y1="533.421"
						x2="-37.6939"
						y2="-135.731"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="white"></stop>
						<stop offset="1" stopColor="#79CFFF"></stop>
					</linearGradient>
					<linearGradient
						id="paint7_linear_1_2"
						x1="380.676"
						y1="-89.0869"
						x2="120.669"
						y2="424.902"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="white"></stop>
						<stop offset="1" stopColor="#79CFFF"></stop>
					</linearGradient>
				</defs>
			</svg>
		),
	},
];
