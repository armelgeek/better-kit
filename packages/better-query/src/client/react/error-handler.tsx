"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * Error types for better classification
 */
export enum ErrorType {
	NETWORK = "NETWORK",
	VALIDATION = "VALIDATION",
	AUTHORIZATION = "AUTHORIZATION",
	NOT_FOUND = "NOT_FOUND",
	SERVER = "SERVER",
	UNKNOWN = "UNKNOWN",
}

/**
 * Structured error object
 */
export interface AppError {
	type: ErrorType;
	message: string;
	code?: string;
	details?: any;
	timestamp: number;
	resource?: string;
	operation?: string;
}

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
	/** Whether to log errors to console */
	logErrors?: boolean;
	/** Custom error reporter (e.g., Sentry) */
	errorReporter?: (error: AppError) => void;
	/** Global error handler */
	onError?: (error: AppError) => void;
	/** Maximum number of errors to keep in history */
	maxErrorHistory?: number;
}

/**
 * Error context value
 */
interface ErrorContextValue {
	errors: AppError[];
	lastError: AppError | null;
	clearErrors: () => void;
	clearError: (timestamp: number) => void;
	handleError: (error: any, context?: { resource?: string; operation?: string }) => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

/**
 * Error provider component
 */
export function ErrorProvider({
	children,
	options = {},
}: {
	children: React.ReactNode;
	options?: ErrorHandlerOptions;
}) {
	const {
		logErrors = true,
		errorReporter,
		onError,
		maxErrorHistory = 10,
	} = options;

	const [errors, setErrors] = useState<AppError[]>([]);
	const [lastError, setLastError] = useState<AppError | null>(null);

	const handleError = useCallback(
		(error: any, context?: { resource?: string; operation?: string }) => {
			const appError: AppError = {
				type: classifyError(error),
				message: extractErrorMessage(error),
				code: error?.code || error?.error?.code,
				details: error?.details || error?.error?.details,
				timestamp: Date.now(),
				resource: context?.resource,
				operation: context?.operation,
			};

			// Log to console if enabled
			if (logErrors) {
				console.error("[Better Query Error]", appError);
			}

			// Report to external service
			if (errorReporter) {
				errorReporter(appError);
			}

			// Call global error handler
			if (onError) {
				onError(appError);
			}

			// Update state
			setLastError(appError);
			setErrors((prev) => {
				const newErrors = [appError, ...prev];
				return newErrors.slice(0, maxErrorHistory);
			});
		},
		[logErrors, errorReporter, onError, maxErrorHistory],
	);

	const clearErrors = useCallback(() => {
		setErrors([]);
		setLastError(null);
	}, []);

	const clearError = useCallback((timestamp: number) => {
		setErrors((prev) => prev.filter((e) => e.timestamp !== timestamp));
		setLastError((prev) => (prev?.timestamp === timestamp ? null : prev));
	}, []);

	return (
		<ErrorContext.Provider
			value={{
				errors,
				lastError,
				clearErrors,
				clearError,
				handleError,
			}}
		>
			{children}
		</ErrorContext.Provider>
	);
}

/**
 * Hook to access error context
 */
export function useErrorHandler() {
	const context = useContext(ErrorContext);
	if (!context) {
		throw new Error("useErrorHandler must be used within ErrorProvider");
	}
	return context;
}

/**
 * Classify error type based on error object
 */
function classifyError(error: any): ErrorType {
	// Network errors
	if (
		error?.message?.includes("fetch") ||
		error?.message?.includes("network") ||
		error?.code === "NETWORK_ERROR"
	) {
		return ErrorType.NETWORK;
	}

	// Validation errors
	if (
		error?.code === "VALIDATION_FAILED" ||
		error?.error?.code === "VALIDATION_FAILED"
	) {
		return ErrorType.VALIDATION;
	}

	// Authorization errors
	if (
		error?.code === "FORBIDDEN" ||
		error?.code === "UNAUTHORIZED" ||
		error?.error?.code === "FORBIDDEN" ||
		error?.error?.code === "UNAUTHORIZED"
	) {
		return ErrorType.AUTHORIZATION;
	}

	// Not found errors
	if (
		error?.code === "NOT_FOUND" ||
		error?.error?.code === "NOT_FOUND"
	) {
		return ErrorType.NOT_FOUND;
	}

	// Server errors
	if (
		error?.code === "INTERNAL_ERROR" ||
		error?.error?.code === "INTERNAL_ERROR"
	) {
		return ErrorType.SERVER;
	}

	return ErrorType.UNKNOWN;
}

/**
 * Extract error message from various error formats
 */
function extractErrorMessage(error: any): string {
	if (typeof error === "string") {
		return error;
	}

	if (error?.message) {
		return error.message;
	}

	if (error?.error?.message) {
		return error.error.message;
	}

	return "An unknown error occurred";
}

/**
 * Error boundary component for React errors
 */
interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("[Error Boundary]", error, errorInfo);
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	render() {
		if (this.state.hasError) {
			if (typeof this.props.fallback === "function") {
				return this.props.fallback(this.state.error!);
			}
			return this.props.fallback || <DefaultErrorFallback />;
		}

		return this.props.children;
	}
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback() {
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h2>Something went wrong</h2>
			<p>We're sorry, but something unexpected happened.</p>
			<button
				onClick={() => window.location.reload()}
				style={{
					padding: "10px 20px",
					marginTop: "10px",
					cursor: "pointer",
				}}
			>
				Reload Page
			</button>
		</div>
	);
}

/**
 * Hook to wrap async operations with error handling
 */
export function useAsyncError() {
	const { handleError } = useErrorHandler();

	const wrapAsync = useCallback(
		<T extends (...args: any[]) => Promise<any>>(
			fn: T,
			context?: { resource?: string; operation?: string },
		): T => {
			return (async (...args: any[]) => {
				try {
					return await fn(...args);
				} catch (error) {
					handleError(error, context);
					throw error;
				}
			}) as T;
		},
		[handleError],
	);

	return { wrapAsync, handleError };
}
