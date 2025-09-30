"use client";

import { signIn, signUp } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Please enter a valid email"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

export default function AuthForm() {
	const router = useRouter();
	const [isSignUp, setIsSignUp] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const signInForm = useForm<SignInData>({
		resolver: zodResolver(signInSchema),
	});

	const signUpForm = useForm<SignUpData>({
		resolver: zodResolver(signUpSchema),
	});

	const handleSignIn = async (data: SignInData) => {
		setIsLoading(true);
		const result = await signIn.email({
			email: data.email,
			password: data.password,
		});
		setIsLoading(false);

		if (!result.data) {
			// Error is already handled in useAuth hook
			console.error("Sign in failed:", result.error);
		}
		router.push("/todo");
	};

	const handleSignUp = async (data: SignUpData) => {
		const result = await signUp.email({
			email: data.email,
			password: data.password,
			name: data.name,
		});
		if (!result.data) {
			// Error is already handled in useAuth hook
			console.error("Sign up failed:", result.error);
		}
		router.push("/todo");
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="text-center">
					<h2 className="text-3xl font-bold tracking-tight text-gray-900">
						{isSignUp ? "Create your account" : "Sign in to your account"}
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						{isSignUp
							? "Get started with your todo list"
							: "Welcome back to your todos"}
					</p>
				</div>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					{isSignUp ? (
						<form
							onSubmit={signUpForm.handleSubmit(handleSignUp)}
							className="space-y-6"
						>
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium text-gray-700"
								>
									Full Name
								</label>
								<input
									{...signUpForm.register("name")}
									type="text"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									placeholder="John Doe"
								/>
								{signUpForm.formState.errors.name && (
									<p className="mt-1 text-sm text-red-600">
										{signUpForm.formState.errors.name.message}
									</p>
								)}
							</div>

							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700"
								>
									Email Address
								</label>
								<input
									{...signUpForm.register("email")}
									type="email"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									placeholder="john@example.com"
								/>
								{signUpForm.formState.errors.email && (
									<p className="mt-1 text-sm text-red-600">
										{signUpForm.formState.errors.email.message}
									</p>
								)}
							</div>

							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700"
								>
									Password
								</label>
								<input
									{...signUpForm.register("password")}
									type="password"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
								{signUpForm.formState.errors.password && (
									<p className="mt-1 text-sm text-red-600">
										{signUpForm.formState.errors.password.message}
									</p>
								)}
							</div>

							<div>
								<label
									htmlFor="confirmPassword"
									className="block text-sm font-medium text-gray-700"
								>
									Confirm Password
								</label>
								<input
									{...signUpForm.register("confirmPassword")}
									type="password"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
								{signUpForm.formState.errors.confirmPassword && (
									<p className="mt-1 text-sm text-red-600">
										{signUpForm.formState.errors.confirmPassword.message}
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
							>
								{isLoading ? "Creating account..." : "Create account"}
							</button>
						</form>
					) : (
						<form
							onSubmit={signInForm.handleSubmit(handleSignIn)}
							className="space-y-6"
						>
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700"
								>
									Email Address
								</label>
								<input
									{...signInForm.register("email")}
									type="email"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									placeholder="john@example.com"
								/>
								{signInForm.formState.errors.email && (
									<p className="mt-1 text-sm text-red-600">
										{signInForm.formState.errors.email.message}
									</p>
								)}
							</div>

							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700"
								>
									Password
								</label>
								<input
									{...signInForm.register("password")}
									type="password"
									className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								/>
								{signInForm.formState.errors.password && (
									<p className="mt-1 text-sm text-red-600">
										{signInForm.formState.errors.password.message}
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
							>
								{isLoading ? "Signing in..." : "Sign in"}
							</button>
						</form>
					)}

					<div className="mt-6">
						<div className="text-center">
							<button
								type="button"
								onClick={() => setIsSignUp(!isSignUp)}
								className="text-blue-600 hover:text-blue-500 text-sm"
							>
								{isSignUp
									? "Already have an account? Sign in"
									: "Don't have an account? Sign up"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
