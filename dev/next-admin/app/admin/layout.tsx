export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-gray-100">
			{/* Navigation */}
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex">
							<div className="flex-shrink-0 flex items-center">
								<h1 className="text-2xl font-bold text-blue-600">
									Better Admin
								</h1>
							</div>
							<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
								<a
									href="/admin/dashboard"
									className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									📊 Dashboard
								</a>
								<a
									href="/admin/products"
									className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									📦 Products
								</a>
								<a
									href="/admin/users"
									className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									👥 Users
								</a>
								<a
									href="/admin/orders"
									className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
								>
									🛒 Orders
								</a>
							</div>
						</div>
					</div>
				</div>
			</nav>

			{/* Content */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">{children}</div>
			</main>
		</div>
	);
}
