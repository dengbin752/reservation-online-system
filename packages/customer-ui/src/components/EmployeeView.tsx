import {
	ApolloClient,
	type ApolloError,
	createHttpLink,
	gql,
	InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import type {
	PaginatedResponse,
	PaginationParams,
	Reservation,
	ReservationFilters,
	ReservationStatus,
	User,
} from "@shared/reservation-system";
import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, onMount } from "solid-js";

const apolloclient = (() => {
	const httpLink = createHttpLink({
		uri: "/api/graphql",
	});
	const authLink = setContext((_, { headers }) => {
		const token = JSON.parse(
			localStorage.getItem("auth:user") || "null",
		)?.token;
		return {
			headers: {
				...headers,
				authorization: token ? `Bearer ${token}` : "",
			},
		};
	});
	const client = new ApolloClient({
		link: authLink.concat(httpLink),
		cache: new InMemoryCache(),
	});
	return client;
})();

type ReservationWithCustomer = Reservation & {
	customer: Pick<User, "email" | "firstName" | "lastName" | "phone">;
};

export function EmployeeView() {
	const navigate = useNavigate();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_user, setUser] = createSignal({
		id: "",
		email: "",
		token: "",
		refreshToken: "",
	});

	onMount(() => {
		const user = JSON.parse(localStorage.getItem("auth:user") || "null");
		if (!user) {
			setTimeout(() => navigate("/logreg"), 0);
			return;
		}
		setUser(user);
	});
	// 过滤器状态
	const [filterDate, setFilterDate] = createSignal("");
	const [filterStatus, setFilterStatus] = createSignal("");

	//   PENDING = 'PENDING',
	//   CONFIRMED = 'CONFIRMED',
	//   CANCELLED = 'CANCELLED',
	//   COMPLETED = 'COMPLETED',
	//   NO_SHOW = 'NO_SHOW'

	// 预订列表状态
	const [reservations, setReservations] = createSignal<
		PaginatedResponse<ReservationWithCustomer>
	>({
		data: [
			// {
			// 	id: "1",
			// 	title: "",
			// 	date: new Date("2025-10-26"),
			// 	time: "19:30",
			// 	partySize: 4,
			// 	status: "PENDING" as Reservation["status"],
			// 	specialRequests: "Window seat preferred",
			// 	customerId: "",
			// 	tableId: "",
			// 	createdAt: new Date(),
			// 	updatedAt: new Date(),
			// 	customer: {
			// 		email: "john@example.com",
			// 		firstName: "John",
			// 		lastName: "Doe",
			// 		phone: "+1 (555) 123-4567",
			// 	},
			// },
			// {
			// 	id: "2",
			// 	title: "",
			// 	date: new Date("2025-10-26"),
			// 	time: "19:30",
			// 	partySize: 2,
			// 	status: "CONFIRMED" as Reservation["status"],
			// 	customerId: "",
			// 	tableId: "",
			// 	createdAt: new Date(),
			// 	updatedAt: new Date(),
			// 	customer: {
			// 		email: "john@example.com",
			// 		firstName: "John",
			// 		lastName: "Doe",
			// 		phone: "+1 (555) 123-4567",
			// 	},
			// },
		],
		total: 0,
		page: 1,
		limit: 10,
		totalPages: 0,
	});

	const [selectedReservation, setSelectedReservation] =
		createSignal<ReservationWithCustomer | null>(null);
	const [showModal, setShowModal] = createSignal(false);

	const [filteredReservations, setFilteredReservations] = createSignal<
		ReservationWithCustomer[]
	>([]);

	createEffect(() => {
		let filtered = reservations().data;

		if (filterDate()) {
			filtered = filtered.filter((res) => {
				return res.date.toISOString().startsWith(filterDate())
			});
		}

		if (filterStatus()) {
			filtered = filtered.filter(
				(res) => res.status === filterStatus(),
			);
		}

		setFilteredReservations(filtered);
	});

	const handleViewDetails = (reservation: ReservationWithCustomer) => {
		setSelectedReservation(reservation);
		setShowModal(true);
	};

	const handleUpdateStatus = async (id: string, newStatus: Reservation["status"]) => {
		const UPDATE_RESERVATION_STATUS = gql`
mutation UpdateReservationStatus($updateReservationStatusId: ID!, $status: ReservationStatus!) {
  updateReservationStatus(id: $updateReservationStatusId, status: $status) {
    id
    status
  }
}
`
		try {
			const { data } = await apolloclient.mutate({
				mutation: UPDATE_RESERVATION_STATUS,
				variables: {
					updateReservationStatusId: id,
					status: newStatus,
				},
			});
			if (data.updateReservationStatus.status === newStatus) {
				setReservations((prev) => ({
					...prev,
					data: prev.data.map((res) => (res.id === id ? { ...res, status: newStatus } : res)),
				} as PaginatedResponse<ReservationWithCustomer>));
			}
		} catch (error) {
			console.log(error)
		}
	};

	const getStatusClass = (status: Reservation["status"]) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-100 text-yellow-800";
			case "CONFIRMED":
				return "bg-green-100 text-green-800";
			case "CANCELLED":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatStatus = (status: Reservation["status"]) => {
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	onMount(async () => {
		const GET_RESERVATIONS = gql`
query Reservations($filters: ReservationFilters, $pagination: PaginationParams) {
  reservations(filters: $filters, pagination: $pagination) {
    data {
      id
      title
      customerId
      tableId
      date
      time
      partySize
      status
      specialRequests
      createdAt
      updatedAt
      customer {
        email
        firstName
        lastName
        phone
      }
    }
    total
    page
    limit
    totalPages
  }
}
`;
		try {
			const filters: ReservationFilters = {
				date: new Date(filterDate()),
				status: (filterStatus() as Reservation["status"]) || null,
			};
			const paginate: PaginationParams = {
				limit: 10,
				page: 1,
				sortBy: "createdAt",
				sortOrder: "desc",
			};
			const { data } = await apolloclient.query({
				query: GET_RESERVATIONS,
				variables: { filters, paginate },
				fetchPolicy: "network-only",
			});

			setReservations({
				...data.reservations,
				data: data.reservations.data.map((res: ReservationWithCustomer) => ({
					...res,
					date: new Date(res.date),
					createdAt: new Date(res.createdAt),
					updatedAt: new Date(res.updatedAt),
				}))
			});
		} catch (error) {
			const networkError = (error as ApolloError).networkError;
			if (networkError && 'statusCode' in networkError) {
				const statusCode = (networkError as { statusCode?: number }).statusCode;
				if (statusCode === 403) {
					// token expired
					setTimeout(() => navigate("/logreg"), 0);
					return;
				}
			}
			// TODO:
			console.log(error);
			throw error;
		}
	});

	return (
		<div class="p-8 space-y-8">
			<h2 class="text-3xl font-bold text-gray-800 text-center">
				Reservation Dashboard
			</h2>
			<p class="text-center text-gray-500 max-w-xl mx-auto">
				View and manage all incoming reservations.
			</p>

			{/* Filters */}
			<div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center mb-6">
				<div class="flex-grow w-full md:w-auto">
					<label for="filterDate" class="sr-only">
						Filter by Date
					</label>
					<input
						type="date"
						id="filterDate"
						value={filterDate()}
						onInput={(e) => setFilterDate(e.currentTarget.value)}
						class="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm"
					/>
				</div>
				<div class="flex-grow w-full md:w-auto">
					<label for="filterStatus" class="sr-only">
						Filter by Status
					</label>
					<select
						id="filterStatus"
						value={filterStatus()}
						onInput={(e) => setFilterStatus(e.currentTarget.value)}
						class="w-full px-4 py-2 border border-gray-300 rounded-full shadow-sm"
					>
						<option value="">All Statuses</option>
						<option value="PENDING">Pending</option>
						<option value="CONFIRMED">Confirmed</option>
						<option value="CANCELLED">Cancelled</option>
						<option value="COMPLETED">Completed</option>
						<option value="NO_SHOW">No Show</option>
					</select>
				</div>
			</div>

			{/* Reservation List */}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200 rounded-lg shadow-sm border border-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Guest Name
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Arrival Time
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Table Size
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Status
							</th>
							<th
								scope="col"
								class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						<For each={filteredReservations()}>
							{(reservation) => (
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{reservation.customer.firstName}{" "}
										{reservation.customer.lastName}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{reservation.date.toLocaleDateString()} {reservation.time}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{reservation.partySize}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span
											class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(reservation.status)}`}
										>
											{formatStatus(reservation.status)}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<button
											onClick={() => handleViewDetails(reservation)}
											class="text-blue-600 hover:text-blue-900 transition mr-3"
										>
											View Details
										</button>
										{reservation.status === "PENDING" as ReservationStatus && (
											<>
												<button
													onClick={() =>
														handleUpdateStatus(reservation.id, "CONFIRMED" as ReservationStatus)
													}
													class="text-green-600 hover:text-green-900 transition mr-3"
												>
													Confirm
												</button>
												<button
													onClick={() =>
														handleUpdateStatus(reservation.id, "CANCELLED" as ReservationStatus)
													}
													class="text-red-600 hover:text-red-900 transition"
												>
													Cancel
												</button>
											</>
										)}
									</td>
								</tr>
							)}
						</For>
					</tbody>
				</table>
			</div>

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
										{selectedReservation()?.customer.firstName}{" "}
										{selectedReservation()?.customer.lastName}
									</p>
									{selectedReservation()?.customer && (
										<>
											<p class="mt-1 text-sm text-gray-900">
												{selectedReservation()?.customer.email}
											</p>
											<p class="mt-1 text-sm text-gray-900">
												{selectedReservation()?.customer.phone}
											</p>
										</>
									)}
								</div>

								<div>
									<h4 class="text-sm font-medium text-gray-500">
										Reservation Details
									</h4>
									<p class="mt-1 text-sm text-gray-900">
										Date & Time:{" "}
										{selectedReservation()?.date.toLocaleDateString()}{" "}
										{selectedReservation()?.time}
									</p>
									<p class="mt-1 text-sm text-gray-900">
										Table Size: {selectedReservation()?.partySize} guests
									</p>
									<div class="mt-1">
										<span
											class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(selectedReservation()?.status || "NO_SHOW" as ReservationStatus)}`}
										>
											{formatStatus(selectedReservation()?.status || "NO_SHOW" as ReservationStatus)}
										</span>
									</div>
								</div>

								{selectedReservation()?.specialRequests && (
									<div>
										<h4 class="text-sm font-medium text-gray-500">
											Special Requests
										</h4>
										<p class="mt-1 text-sm text-gray-900">
											{selectedReservation()?.specialRequests}
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
								{selectedReservation()?.status ===
									("PENDING" as ReservationStatus) && (
									<>
										<button
											type="button"
											onClick={() => {
												handleUpdateStatus(
													selectedReservation()?.id || "",
													"CONFIRMED" as ReservationStatus,
												);
												setShowModal(false);
											}}
											class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
										>
											Confirm	
										</button>
										<button
											type="button"
											onClick={() => {
												handleUpdateStatus(
													selectedReservation()?.id || "",
													"CANCELLED" as ReservationStatus,
												);
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
	);
}
