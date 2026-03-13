import { createSignal, createEffect, For, Show } from "solid-js";
import axios from "axios";

interface Reservation {
	id: string;
	date: string;
	time: string;
	guests: number;
	tableNumber: number;
	location: string;
	status: string;
	firstName: string;
	lastName: string;
	contactInfo: string;
}

interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
}

interface OperationLog {
	id: string;
	adminId: string;
	adminName: string;
	action: string;
	reservationId: string;
	previousStatus?: string;
	newStatus: string;
	details?: string;
	timestamp: string;
}

export function Dashboard() {
	const [reservations, setReservations] = createSignal<Reservation[]>([]);
	const [currentUser, setCurrentUser] = createSignal<User | null>(null);
	const [isLoading, setIsLoading] = createSignal(true);
	const [filter, setFilter] = createSignal("ALL");
	const [operationLogs, setOperationLogs] = createSignal<OperationLog[]>([]);
	const [showLogs, setShowLogs] = createSignal(false);

	// View details modal state
	const [selectedReservation, setSelectedReservation] = createSignal<Reservation | null>(null);
	const [showModal, setShowModal] = createSignal(false);

	// Get current user info
	createEffect(() => {
		const userStr = localStorage.getItem("auth:user");
		if (userStr) {
			const user = JSON.parse(userStr);
			setCurrentUser(user);
		}
	});

	// Fetch reservations data with pagination
	const fetchReservations = async (page: number = 1) => {
		setIsLoading(true);
		try {
			const userStr = localStorage.getItem("auth:user");
			if (!userStr) {
				window.location.href = "/admin/login";
				return;
			}
			const user = JSON.parse(userStr);

			const response = await axios.get(`/api/reservations?page=${page}&limit=10`, {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			});
			// Handle both paginated and non-paginated responses
			if (Array.isArray(response.data)) {
				setReservations(response.data);
			} else {
				setReservations(response.data.data || []);
			}
		} catch (error) {
			console.error("Error fetching reservations:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch operation logs
	const fetchOperationLogs = async () => {
		try {
			const userStr = localStorage.getItem("auth:user");
			if (!userStr) return;
			const user = JSON.parse(userStr);

			const response = await axios.get("/api/reservations/logs?limit=50", {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			});
			setOperationLogs(response.data);
		} catch (error) {
			console.error("Error fetching operation logs:", error);
		}
	};

	// Format timestamp
	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Get action display text
	const getActionText = (action: string) => {
		switch (action) {
			case "CONFIRM":
				return "Confirm Reservation";
			case "CANCEL":
				return "Cancel Reservation";
			case "COMPLETE":
				return "Complete Reservation";
			case "REOPEN":
				return "Reopen";
			case "STATUS_CHANGE":
				return "Status Change";
			default:
				return action;
		}
	};

	// Get action type color
	const getActionColor = (action: string) => {
		switch (action) {
			case "CONFIRM":
				return "bg-green-100 text-green-800";
			case "CANCEL":
				return "bg-red-100 text-red-800";
			case "COMPLETE":
				return "bg-blue-100 text-blue-800";
			case "REOPEN":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	createEffect(() => {
		fetchReservations();
	});

	// Filter reservations
	const filteredReservations = () => {
		const filterValue = filter();
		if (filterValue === "ALL") {
			return reservations();
		}
		return reservations().filter((r) => r.status === filterValue);
	};

	// Confirm reservation
	const confirmReservation = async (id: string) => {
		try {
			const userStr = localStorage.getItem("auth:user");
			if (!userStr) return;
			const user = JSON.parse(userStr);

			await axios.put(
				`/api/reservations/${id}`,
				{ status: "CONFIRMED" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				},
			);
			fetchReservations();
			if (showLogs()) {
				fetchOperationLogs();
			}
		} catch (error) {
			console.error("Error confirming reservation:", error);
		}
	};

	// Cancel reservation
	const cancelReservation = async (id: string) => {
		try {
			const userStr = localStorage.getItem("auth:user");
			if (!userStr) return;
			const user = JSON.parse(userStr);

			await axios.put(
				`/api/reservations/${id}`,
				{ status: "CANCELLED" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				},
			);
			fetchReservations();
			if (showLogs()) {
				fetchOperationLogs();
			}
		} catch (error) {
			console.error("Error cancelling reservation:", error);
		}
	};

	// Complete reservation
	const completeReservation = async (id: string) => {
		try {
			const userStr = localStorage.getItem("auth:user");
			if (!userStr) return;
			const user = JSON.parse(userStr);

			await axios.put(
				`/api/reservations/${id}`,
				{ status: "COMPLETED" },
				{
					headers: {
						Authorization: `Bearer ${user.token}`,
					},
				},
			);
			fetchReservations();
			if (showLogs()) {
				fetchOperationLogs();
			}
		} catch (error) {
			console.error("Error completing reservation:", error);
		}
	};

	// View details
	const handleViewDetails = (reservation: Reservation) => {
		setSelectedReservation(reservation);
		setShowModal(true);
	};

	// Logout
	const handleLogout = () => {
		localStorage.removeItem("auth:user");
		window.location.href = "/admin/login";
	};

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case "CONFIRMED":
				return "bg-green-100 text-green-800";
			case "PENDING":
				return "bg-yellow-100 text-yellow-800";
			case "CANCELLED":
				return "bg-red-100 text-red-800";
			case "COMPLETED":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// Current menu: 'reservations' | 'logs'
	const [currentMenu, setCurrentMenu] = createSignal<"reservations" | "logs">("reservations");

	return (
		<div class="min-h-screen bg-gray-50 flex">
			{/* Sidebar */}
			<aside class="w-64 bg-white shadow-sm min-h-screen">
				<div class="p-4">
					<h2 class="text-xl font-bold text-gray-800 mb-6">
						Menu
					</h2>
					<nav class="space-y-2">
						<button
							onClick={() => setCurrentMenu("reservations")}
							classList={{
								"w-full text-left px-4 py-3 rounded-md transition": true,
								"bg-blue-600 text-white": currentMenu() === "reservations",
								"text-gray-700 hover:bg-gray-100": currentMenu() !== "reservations",
							}}
						>
							Reservations
						</button>
						<button
							onClick={() => {
								setCurrentMenu("logs");
								if (!showLogs()) {
									fetchOperationLogs();
									setShowLogs(true);
								}
							}}
							classList={{
								"w-full text-left px-4 py-3 rounded-md transition": true,
								"bg-blue-600 text-white": currentMenu() === "logs",
								"text-gray-700 hover:bg-gray-100": currentMenu() !== "logs",
							}}
						>
							Logs
						</button>
					</nav>
				</div>
			</aside>

			{/* Main Content Area */}
			<div class="flex-1">
				{/* Header */}
				<header class="bg-white shadow-sm">
					<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
						<h1 class="text-2xl font-bold text-gray-800">
							Hotel Reservation - Admin Dashboard
						</h1>
						<div class="flex items-center gap-4">
							<Show when={currentUser()}>
								<span class="text-gray-600">
									Welcome, {currentUser()?.firstName}
								</span>
							</Show>
							<button
								onClick={handleLogout}
								class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
							>
								Logout
							</button>
						</div>
					</div>
				</header>

			{/* Main Content */}
			<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Reservations Section - only show when reservations menu is selected */}
				<Show when={currentMenu() === "reservations"}>{/* Filters */}
				<div class="mb-6 flex gap-4">
					<button
						onClick={() => setFilter("ALL")}
						classList={{
							"px-4 py-2 rounded-md transition": true,
							"bg-blue-600 text-white": filter() === "ALL",
							"bg-white text-gray-700 hover:bg-gray-100": filter() !== "ALL",
						}}
					>
						All ({reservations().length})
					</button>
					<button
						onClick={() => setFilter("PENDING")}
						classList={{
							"px-4 py-2 rounded-md transition": true,
							"bg-yellow-600 text-white": filter() === "PENDING",
							"bg-white text-gray-700 hover:bg-gray-100": filter() !== "PENDING",
						}}
					>
						Pending ({reservations().filter((r) => r.status === "PENDING").length})
					</button>
					<button
						onClick={() => setFilter("CONFIRMED")}
						classList={{
							"px-4 py-2 rounded-md transition": true,
							"bg-green-600 text-white": filter() === "CONFIRMED",
							"bg-white text-gray-700 hover:bg-gray-100": filter() !== "CONFIRMED",
						}}
					>
						Confirmed ({reservations().filter((r) => r.status === "CONFIRMED").length})
					</button>
					<button
						onClick={() => setFilter("COMPLETED")}
						classList={{
							"px-4 py-2 rounded-md transition": true,
							"bg-blue-600 text-white": filter() === "COMPLETED",
							"bg-white text-gray-700 hover:bg-gray-100": filter() !== "COMPLETED",
						}}
					>
						Completed ({reservations().filter((r) => r.status === "COMPLETED").length})
					</button>
					<button
						onClick={() => setFilter("CANCELLED")}
						classList={{
							"px-4 py-2 rounded-md transition": true,
							"bg-red-600 text-white": filter() === "CANCELLED",
							"bg-white text-gray-700 hover:bg-gray-100": filter() !== "CANCELLED",
						}}
					>
						Cancelled ({reservations().filter((r) => r.status === "CANCELLED").length})
					</button>
				</div>

				{/* Reservations Table */}
				<div class="bg-white shadow-sm rounded-lg overflow-hidden">
					<Show when={!isLoading()} fallback={<div class="p-8 text-center">Loading...</div>}>
						<Show
							when={filteredReservations().length > 0}
							fallback={
								<div class="p-8 text-center text-gray-500">
									No reservations found
								</div>
							}
						>
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Guest
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Date & Time
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Contact Information
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Party Size
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									<For each={filteredReservations()}>
										{(reservation) => (
											<tr>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm font-medium text-gray-900">
														{reservation.firstName} {reservation.lastName}
													</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">
														{reservation.date}
													</div>
													<div class="text-sm text-gray-500">
														{reservation.time}
													</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<div class="text-sm text-gray-900">
														{reservation.contactInfo || "-"}
													</div>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
													{reservation.guests} guests
												</td>
												<td class="px-6 py-4 whitespace-nowrap">
													<span
														classList={{
															"px-2 inline-flex text-xs leading-5 font-semibold rounded-full": true,
															[getStatusColor(reservation.status)]: true,
														}}
													>
														{reservation.status}
													</span>
												</td>
												<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
													<button
														onClick={() => handleViewDetails(reservation)}
														class="text-blue-600 hover:text-blue-900 transition mr-3"
													>
														View Details
													</button>
													<Show when={reservation.status === "PENDING"}>
														<button
															onClick={() => confirmReservation(reservation.id)}
															class="text-green-600 hover:text-green-900 mr-4"
														>
															Confirm
														</button>
														<button
															onClick={() => cancelReservation(reservation.id)}
															class="text-red-600 hover:text-red-900"
														>
															Cancel
														</button>
													</Show>
													<Show when={reservation.status === "CONFIRMED"}>
														<button
															onClick={() => completeReservation(reservation.id)}
															class="text-blue-600 hover:text-blue-900 mr-4"
														>
															Complete
														</button>
														<button
															onClick={() => cancelReservation(reservation.id)}
															class="text-red-600 hover:text-red-900"
														>
															Cancel
														</button>
													</Show>
													{/* <Show when={reservation.status === "COMPLETED"}>
														<span class="text-gray-400 text-sm">No actions available</span>
													</Show> */}
													<Show when={reservation.status === "CANCELLED"}>
														<button
															onClick={() => confirmReservation(reservation.id)}
															class="text-green-600 hover:text-green-900"
														>
															Reopen
														</button>
													</Show>
												</td>
											</tr>
										)}
									</For>
								</tbody>
							</table>
						</Show>
					</Show>
				</div>
				</Show>

				{/* Operation Logs Section */}
				<Show when={currentMenu() === "logs"}>
					<div class="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-lg font-medium text-gray-900">
								Operation Logs
							</h2>
						</div>
						<Show
							when={operationLogs().length > 0}
							fallback={
								<div class="p-8 text-center text-gray-500">
									No operation logs yet
								</div>
							}
						>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Time
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Admin
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Action
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Reservation ID
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status Change
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Details
											</th>
										</tr>
									</thead>
									<tbody class="bg-white divide-y divide-gray-200">
										<For each={operationLogs()}>
											{(log) => (
												<tr>
													<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{formatTimestamp(log.timestamp)}
													</td>
													<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{log.adminName}
													</td>
													<td class="px-6 py-4 whitespace-nowrap">
														<span
															classList={{
																"px-2 inline-flex text-xs leading-5 font-semibold rounded-full": true,
																[getActionColor(log.action)]: true,
															}}
														>
															{getActionText(log.action)}
														</span>
													</td>
													<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
														{log.reservationId.substring(0, 8)}...
													</td>
													<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
														{log.previousStatus || "N/A"} → {log.newStatus}
													</td>
													<td class="px-6 py-4 text-sm text-gray-500">
														{log.details || "-"}
													</td>
												</tr>
											)}
										</For>
									</tbody>
								</table>
							</div>
						</Show>
					</div>
				</Show>
			</main>

			{/* Details Modal */}
			{showModal() && selectedReservation() && (
				<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
						<div class="p-6">
							<div class="flex justify-between items-start">
								<h3 class="text-lg font-medium text-gray-900">
									Reservation Details
								</h3>
								<button
									onClick={() => setShowModal(false)}
									class="text-gray-400 hover:text-gray-500"
								>
									<span class="sr-only">Close</span>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

							<div class="mt-4 space-y-4">
								<div>
									<h4 class="text-sm font-medium text-gray-500">
										Guest Information
									</h4>
									<p class="mt-1 text-sm text-gray-900">
										{selectedReservation()?.firstName} {selectedReservation()?.lastName}
									</p>
									<p class="mt-1 text-sm text-gray-900">
										{selectedReservation()?.contactInfo || "-"}
									</p>
								</div>

								<div>
									<h4 class="text-sm font-medium text-gray-500">
										Reservation Details
									</h4>
									<p class="mt-1 text-sm text-gray-900">
										Date: {selectedReservation()?.date}
									</p>
									<p class="mt-1 text-sm text-gray-900">
										Time: {selectedReservation()?.time}
									</p>
									<p class="mt-1 text-sm text-gray-900">
										Party Size: {selectedReservation()?.guests} guests
									</p>
									<div class="mt-2">
										<span
											classList={{
												"px-2 inline-flex text-xs leading-5 font-semibold rounded-full": true,
												[getStatusColor(selectedReservation()?.status || "")]: true,
											}}
										>
											{selectedReservation()?.status}
										</span>
									</div>
								</div>

								{selectedReservation()?.location && (
									<div>
										<h4 class="text-sm font-medium text-gray-500">
											Location
										</h4>
										<p class="mt-1 text-sm text-gray-900">
											{selectedReservation()?.location}
										</p>
									</div>
								)}
							</div>

							<div class="mt-6 flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => setShowModal(false)}
									class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
								>
									Close
								</button>
								{selectedReservation()?.status === "PENDING" && (
									<>
										<button
											type="button"
											onClick={() => {
												confirmReservation(selectedReservation()?.id || "");
												setShowModal(false);
											}}
											class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
										>
											Confirm
										</button>
										<button
											type="button"
											onClick={() => {
												cancelReservation(selectedReservation()?.id || "");
												setShowModal(false);
											}}
											class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
										>
											Cancel
										</button>
									</>
								)}
								{selectedReservation()?.status === "CONFIRMED" && (
									<>
										<button
											type="button"
											onClick={() => {
												completeReservation(selectedReservation()?.id || "");
												setShowModal(false);
											}}
											class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
										>
											Complete
										</button>
										<button
											type="button"
											onClick={() => {
												cancelReservation(selectedReservation()?.id || "");
												setShowModal(false);
											}}
											class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
										>
											Cancel
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
			</div>
		</div>
	);
}
