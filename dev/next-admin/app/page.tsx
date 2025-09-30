export default function HomePage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center">
					<h1 className="text-5xl font-bold text-gray-900 mb-4">
						Better Admin
					</h1>
					<p className="text-xl text-gray-600 mb-8">
						Full-stack admin kit built on Better Query
					</p>

					<div className="space-y-4 mb-8">
						<a
							href="/admin/dashboard"
							className="block w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-medium text-lg"
						>
							🚀 Go to Admin Dashboard
						</a>
						<a
							href="https://github.com/armelgeek/better-kit/tree/master/packages/better-admin"
							target="_blank"
							rel="noopener noreferrer"
							className="block w-full bg-gray-100 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-200 transition font-medium"
						>
							📖 View Documentation
						</a>
					</div>

					<div className="border-t border-gray-200 pt-8 text-left">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							Features
						</h2>
						<ul className="space-y-3 text-gray-600">
							<li className="flex items-start">
								<span className="text-2xl mr-3">✅</span>
								<span>
									<strong>Auto-Generated UI:</strong> Define resources once, get
									a complete admin interface
								</span>
							</li>
							<li className="flex items-start">
								<span className="text-2xl mr-3">🔐</span>
								<span>
									<strong>Authentication:</strong> Seamless integration with
									Better Auth
								</span>
							</li>
							<li className="flex items-start">
								<span className="text-2xl mr-3">🎨</span>
								<span>
									<strong>Headless UI:</strong> Framework-agnostic components
								</span>
							</li>
							<li className="flex items-start">
								<span className="text-2xl mr-3">📊</span>
								<span>
									<strong>Rich Features:</strong> Pagination, sorting,
									filtering, search out of the box
								</span>
							</li>
							<li className="flex items-start">
								<span className="text-2xl mr-3">🔧</span>
								<span>
									<strong>Fully Customizable:</strong> Override any component or
									behavior
								</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
