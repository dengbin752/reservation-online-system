import {
	ApolloClient,
	type ApolloError,
	createHttpLink,
	gql,
	InMemoryCache,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import type {
	CreateReservationInput,
	Reservation,
} from "@shared/reservation-system";
import { useNavigate } from "@solidjs/router";
import { createSignal, createEffect, onMount } from "solid-js";

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

export function GuestView() {
	const navigate = useNavigate();
	const [user, setUser] = createSignal({
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

	// 表单数据状态
	const [formData, setFormData] = createSignal({
		contactInfo: "",
		tableSize: 2,
		arrivalDate: "",
		arrivalTime: "",
		title: "",
		specialRequests: "",
	});

	// 预订列表状态
	const [reservations, setReservations] = createSignal<Reservation[]>([]);

	// 处理表单输入变化
	const handleInputChange = (fieldName: string, value: string | number) => {
		setFormData((prev) => ({
			...prev,
			[fieldName]: value,
		}));
	};

	// 处理表单提交
	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      title
      customerId
      tableId
      date
      time
      partySize
      specialRequests
      status
      createdAt
      updatedAt
    }
  }
`;

		// 在你的代码中添加发送 GraphQL 请求的逻辑
		const newReservation: CreateReservationInput = {
			title: "New Reservation",
			customerId: user().id,
			tableId: "#1234567", // TODO: use real table id
			date: new Date(formData().arrivalDate),
			time: new Date(`1970-01-01T${formData().arrivalTime}`).toLocaleTimeString(
				"en-US",
				{
					hour: "2-digit",
					minute: "2-digit",
				},
			),
			partySize: formData().tableSize,
			contactInfo: formData().contactInfo,
			specialRequests: formData().specialRequests,
		};

		try {
			const { data } = await apolloclient.mutate({
				mutation: CREATE_RESERVATION,
				variables: {
					input: newReservation,
				},
			});

			// 如果请求成功，更新本地状态
			if (data?.createReservation) {
				setReservations((prev) => [data.createReservation, ...prev]);

				setFormData({
					contactInfo: "",
					tableSize: 2,
					arrivalDate: "",
					arrivalTime: "",
					title: "",
					specialRequests: "",
				});
			}
		} catch (error) {
			console.error("Error creating reservation:", error);
			// 处理错误，例如显示错误消息给用户
		}

		// 这里可以添加API调用提交预订
		console.log("Reservation submitted:", newReservation);
	};

	// 处理取消预订
	const handleCancel = async (id: string) => {
		console.log("Cancel reservation:", id);

		const CANCEL_RESERVATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      id
      title
      customerId
      tableId
      date
      time
      partySize
      specialRequests
      status
      createdAt
      updatedAt
    }
  }
`;
		// TODO: cancel time
		// TODO: cancel fee
		try {
			const { data } = await apolloclient.mutate({
				mutation: CANCEL_RESERVATION,
				variables: {
					id,
				},
			});

			// 如果请求成功，更新本地状态
			if (data?.cancelReservation) {
				setReservations((prev) =>
					prev.map((res) =>
						res.id === id
							? { ...res, status: data.cancelReservation.status as Reservation["status"] }
							: res,
					),
				);
			}
		} catch (error) {
			console.error("Error creating reservation:", error);
			// 处理错误，例如显示错误消息给用户
		}
	};

	// 	 PENDING = 'PENDING',
	//   CONFIRMED = 'CONFIRMED',
	//   CANCELLED = 'CANCELLED',
	//   COMPLETED = 'COMPLETED',
	//   NO_SHOW = 'NO_SHOW'
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

	// 使用 createEffect 监听 user 变化，当 user 准备好后获取 reservations
	createEffect(() => {
		const customerId = user().id;
		if (!customerId) return;

		const GET_RESERVATIONS = gql`
query CustomerReservations($customerId: ID!) {
  customerReservations(customerId: $customerId) {
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
  }
}
`;
		apolloclient.query({
			query: GET_RESERVATIONS,
			variables: { customerId },
			fetchPolicy: "network-only",
		}).then(({ data }) => {
			setReservations(data.customerReservations);
		}).catch((error) => {
			const networkError = (error as ApolloError).networkError;
			if (networkError && 'statusCode' in networkError) {
				const statusCode = (networkError as { statusCode?: number }).statusCode;
				if (statusCode === 403) {
					// token expired
					setTimeout(() => navigate("/logreg"), 0);
					return
				}
			}
			console.log(error)
		});
	});

	return (
		<div class="p-8 space-y-8">
			<h2 class="text-3xl font-bold text-gray-800 text-center">
				Make a New Reservation
			</h2>
			<p class="text-center text-gray-500 max-w-xl mx-auto">
				Fill in the details below to reserve your table. A confirmation email
				will be sent once your request is approved.
			</p>

			{/* Reservation Form */}
			<div class="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-100">
				<form
					onSubmit={handleSubmit}
					class="grid grid-cols-1 md:grid-cols-2 gap-6"
				>
					<div class="col-span-1">
						<label
							for="contactInfo"
							class="block text-sm font-medium text-gray-700"
						>
							Contact Information
						</label>
						<input
							type="text"
							id="contactInfo"
							value={formData().contactInfo}
							onInput={(e) =>
								handleInputChange("contactInfo", e.currentTarget.value)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
							placeholder="Your contact information"
						/>
					</div>
					<div class="col-span-1">
						<label
							for="tableSize"
							class="block text-sm font-medium text-gray-700"
						>
							Table Size (Number of Guests)
						</label>
						<input
							type="number"
							id="tableSize"
							min="1"
							value={formData().tableSize}
							onInput={(e) =>
								handleInputChange(
									"tableSize",
									parseInt(e.currentTarget.value) || 1,
								)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
							placeholder="2"
						/>
					</div>

					<div class="col-span-1">
						<label
							for="arrivalDate"
							class="block text-sm font-medium text-gray-700"
						>
							Arrival Date
						</label>
						<input
							type="date"
							id="arrivalDate"
							value={formData().arrivalDate}
							onInput={(e) =>
								handleInputChange("arrivalDate", e.currentTarget.value)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
						/>
					</div>
					<div class="col-span-1">
						<label
							for="arrivalTime"
							class="block text-sm font-medium text-gray-700"
						>
							Arrival Time
						</label>
						<input
							type="time"
							id="arrivalTime"
							value={formData().arrivalTime}
							onInput={(e) =>
								handleInputChange("arrivalTime", e.currentTarget.value)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
						/>
					</div>

					<div class="col-span-1">
						<label for="title" class="block text-sm font-medium text-gray-700">
							Title
						</label>
						<input
							type="text"
							id="title"
							value={formData().title}
							onInput={(e) => handleInputChange("title", e.currentTarget.value)}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
							placeholder="Reservation Title"
						/>
					</div>
					<div class="col-span-1">
						<label
							for="specialRequests"
							class="block text-sm font-medium text-gray-700"
						>
							Special Requests
						</label>
						<input
							type="text"
							id="specialRequests"
							value={formData().specialRequests}
							onInput={(e) =>
								handleInputChange("specialRequests", e.currentTarget.value)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
							placeholder="Special Requests"
						/>
					</div>
					<div class="col-span-2 text-center mt-4">
						<button
							type="submit"
							class="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-md hover:bg-blue-700 transition"
						>
							Submit Reservation
						</button>
					</div>
				</form>
			</div>

			{/* Section to view/manage existing reservations */}
			<div class="mt-12 text-center">
				<h3 class="text-2xl font-semibold text-gray-800 mb-4">
					Your Reservations
				</h3>
				<p class="text-gray-500 mb-6">
					Manage your existing reservations below. (Debug: {reservations().length} reservations)
				</p>
				<div class="space-y-4">
					{reservations().map((reservation) => (
						<div class="bg-gray-50 p-6 rounded-lg shadow-md flex justify-between items-center transition hover:shadow-lg border border-gray-100">
							<div>
								<h4 class="text-lg font-bold">
									{reservation.title || "Your Reservation"}
								</h4>
								<p class="text-sm text-gray-600">
									{new Date(reservation.date).toLocaleDateString()} at {reservation.time} for{" "}
									{reservation.partySize} guests
								</p>
								<span
									class={`mt-2 inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(reservation.status)}`}
								>
									{reservation.status.charAt(0).toUpperCase() +
										reservation.status.slice(1)}
								</span>
							</div>
							<div>{reservation.specialRequests}</div>
							<div class="space-x-2">
								{/* <button
									onClick={() => handleEdit(reservation.id)}
									class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition"
								>
									Edit
								</button> */}
								{reservation.status !== "CANCELLED" && (
									<button
										onClick={() => handleCancel(reservation.id)}
										class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition"
									>
										Cancel
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
