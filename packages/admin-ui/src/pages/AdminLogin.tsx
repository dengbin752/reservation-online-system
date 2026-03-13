import { useNavigate } from "@solidjs/router";
import axios from "axios";
import { createSignal } from "solid-js";

interface LoginForm {
	email: string;
	password: string;
}

export function AdminLogin() {
	const navigate = useNavigate();

	const [loginForm, setLoginForm] = createSignal<LoginForm>({
		email: "",
		password: "",
	});

	const [loginError, setLoginError] = createSignal("");
	const [isLoggingIn, setIsLoggingIn] = createSignal(false);

	const handleLoginInputChange = (field: keyof LoginForm, value: string) => {
		setLoginForm((prev) => ({
			...prev,
			[field]: value,
		}));
		if (loginError()) setLoginError("");
	};

	const handleLoginSubmit = async (e: Event) => {
		e.preventDefault();
		setIsLoggingIn(true);
		setLoginError("");

		try {
			// Use server-side admin login endpoint (role verification is done on server)
			const ret = await axios.post("/api/auth/admin/login", {
				email: loginForm().email,
				password: loginForm().password,
			});

			// Handle new response format with success wrapper
			const responseData = ret.data.success ? ret.data.data : ret.data;
			
			localStorage.setItem(
				"auth:user",
				JSON.stringify({
					id: responseData.user.id,
					email: responseData.user.email,
					firstName: responseData.user.firstName,
					lastName: responseData.user.lastName,
					role: responseData.user.role,
					token: responseData.token,
					refreshToken: responseData.refreshToken,
				}),
			);
			navigate("/dashboard");
		} catch (error: any) {
			// Handle new error response format
			const errorMessage = error.response?.data?.error?.message 
				|| error.response?.data?.error 
				|| error.message 
				|| "Login failed. Please check your credentials.";
			setLoginError(errorMessage);
			console.error("Login error:", error);
		} finally {
			setIsLoggingIn(false);
		}
	};

	return (
		<div class="min-h-screen flex items-center justify-center bg-gray-100">
			<div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<div class="text-center mb-8">
					<h1 class="text-3xl font-bold text-gray-800">Reservation</h1>
					<p class="text-gray-600 mt-2">Admin Portal</p>
				</div>

				{loginError() && (
					<div class="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
						{loginError()}
					</div>
				)}

				<form onSubmit={handleLoginSubmit} class="space-y-6">
					<div>
						<label
							for="loginEmail"
							class="block text-sm font-medium text-gray-700"
						>
							Admin Email
						</label>
						<input
							type="email"
							id="loginEmail"
							value={loginForm().email}
							onInput={(e) =>
								handleLoginInputChange("email", e.currentTarget.value)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
							placeholder="admin@hotel.com"
							required
						/>
					</div>
					<div>
						<label
							for="loginPassword"
							class="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<input
							type="password"
							id="loginPassword"
							value={loginForm().password}
							onInput={(e) =>
								handleLoginInputChange("password", e.currentTarget.value)
							}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
							placeholder="Enter your password"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={isLoggingIn()}
						classList={{
							"w-full px-6 py-3 rounded-full font-semibold shadow-md transition": true,
							"bg-blue-600 text-white hover:bg-blue-700": !isLoggingIn(),
							"bg-blue-400 cursor-not-allowed": isLoggingIn(),
						}}
					>
						{isLoggingIn() ? "Logging in..." : "Admin Login"}
					</button>
				</form>
			</div>
		</div>
	);
}
