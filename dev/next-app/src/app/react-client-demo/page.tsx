"use client";

import { ReactClientDemo, ReactHooksDemo } from "../../components/ReactClientDemo";

export default function ReactClientDemoPage() {
	return (
		<div className="min-h-screen p-8 bg-gray-50">
			<div className="max-w-4xl mx-auto space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						React Client Demo
					</h1>
					<p className="text-gray-600">
						Demonstrating client-side API calls vs server actions
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
					<ReactClientDemo />
					<ReactHooksDemo />
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-blue-900 mb-3">
						🔍 How to Verify Client-Side Calls
					</h2>
					<ul className="text-sm text-blue-800 space-y-2">
						<li>1. Open your browser's Developer Tools (F12)</li>
						<li>2. Go to the Network tab</li>
						<li>3. Click any button above</li>
						<li>4. You'll see actual HTTP requests to <code>/api/query/product</code></li>
						<li>5. This proves the calls are client-side, not server actions!</li>
					</ul>
				</div>

				<div className="bg-green-50 border border-green-200 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-green-900 mb-3">
						✅ What This Fixes
					</h2>
					<div className="text-sm text-green-800 space-y-2">
						<p><strong>Before:</strong> <code>createQueryClient()</code> used server actions (no network calls visible)</p>
						<p><strong>After:</strong> <code>createReactQueryClient()</code> makes real client-side API calls</p>
						<p><strong>Result:</strong> Perfect for interactive SPAs, authentication flows, and real-time updates</p>
					</div>
				</div>
			</div>
		</div>
	);
}