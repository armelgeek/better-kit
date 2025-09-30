export default function DashboardPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
				<p className="text-gray-500 mt-1">Welcome to Better Admin</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<span className="text-4xl">📦</span>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total Products
									</dt>
									<dd className="text-3xl font-semibold text-gray-900">-</dd>
								</dl>
							</div>
						</div>
					</div>
					<div className="bg-gray-50 px-5 py-3">
						<div className="text-sm">
							<a
								href="/admin/products"
								className="font-medium text-blue-600 hover:text-blue-500"
							>
								View all
							</a>
						</div>
					</div>
				</div>

				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<span className="text-4xl">👥</span>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total Users
									</dt>
									<dd className="text-3xl font-semibold text-gray-900">-</dd>
								</dl>
							</div>
						</div>
					</div>
					<div className="bg-gray-50 px-5 py-3">
						<div className="text-sm">
							<a
								href="/admin/users"
								className="font-medium text-blue-600 hover:text-blue-500"
							>
								View all
							</a>
						</div>
					</div>
				</div>

				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<span className="text-4xl">🛒</span>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total Orders
									</dt>
									<dd className="text-3xl font-semibold text-gray-900">-</dd>
								</dl>
							</div>
						</div>
					</div>
					<div className="bg-gray-50 px-5 py-3">
						<div className="text-sm">
							<a
								href="/admin/orders"
								className="font-medium text-blue-600 hover:text-blue-500"
							>
								View all
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="bg-white shadow rounded-lg p-6">
				<h2 className="text-lg font-medium text-gray-900 mb-4">
					Quick Actions
				</h2>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<a
						href="/admin/products/new"
						className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
					>
						+ Add Product
					</a>
					<a
						href="/admin/products"
						className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
					>
						View Products
					</a>
					<a
						href="/admin/users"
						className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
					>
						View Users
					</a>
					<a
						href="/admin/orders"
						className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
					>
						View Orders
					</a>
				</div>
			</div>

			{/* Info */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
				<h3 className="text-lg font-medium text-blue-900 mb-2">
					🎉 Welcome to Better Admin!
				</h3>
				<p className="text-blue-700">
					This is a demonstration of Better Admin - a full-stack admin kit built
					on Better Query. The admin interface is auto-generated from your
					resource definitions with full type safety and authentication support.
				</p>
				<div className="mt-4 space-x-4">
					<a
						href="https://github.com/armelgeek/better-kit/tree/master/packages/better-admin"
						className="text-blue-600 hover:text-blue-800 font-medium"
						target="_blank"
						rel="noopener noreferrer"
					>
						📖 Documentation
					</a>
					<a
						href="https://github.com/armelgeek/better-kit"
						className="text-blue-600 hover:text-blue-800 font-medium"
						target="_blank"
						rel="noopener noreferrer"
					>
						💻 GitHub
					</a>
				</div>
			</div>
		</div>
	);
}
