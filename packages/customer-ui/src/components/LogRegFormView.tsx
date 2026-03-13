import { useNavigate } from "@solidjs/router";
import axios from "axios";
import { createSignal } from "solid-js";

interface LoginForm {
	email: string;
	password: string;
}

interface RegisterForm {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone: string;
}

export function LogRegFormView() {
	const navigate = useNavigate();

	const [loginForm, setLoginForm] = createSignal<LoginForm>({
		email: "",
		password: "",
	});

	const [registerForm, setRegisterForm] = createSignal<RegisterForm>({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		phone: "",
	});

	const [loginError, setLoginError] = createSignal("");
	const [registerError, setRegisterError] = createSignal("");

	const [isLoggingIn, setIsLoggingIn] = createSignal(false);
	const [isRegistering, setIsRegistering] = createSignal(false);

	const handleLoginInputChange = (field: keyof LoginForm, value: string) => {
		setLoginForm((prev) => ({
			...prev,
			[field]: value,
		}));
		if (loginError()) setLoginError("");
	};

	const handleRegisterInputChange = (
		field: keyof RegisterForm,
		value: string,
	) => {
		setRegisterForm((prev) => ({
			...prev,
			[field]: value,
		}));
		if (registerError()) setRegisterError("");
	};

	const handleLoginSubmit = async (e: Event) => {
		e.preventDefault();
		setIsLoggingIn(true);
		setLoginError("");

		try {
			const ret = await axios.post("/api/auth/login", {
				email: loginForm().email,
				password: loginForm().password,
			});

			localStorage.setItem(
				"auth:user",
				JSON.stringify({
					id: ret.data.user.id,
					email: ret.data.user.email,
					role: ret.data.user.role,
					token: ret.data.token,
					refreshToken: ret.data.refreshToken,
				}),
			);
			navigate("/");
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

	// 处理注册表单提交
	const handleRegisterSubmit = async (e: Event) => {
		e.preventDefault();
		setIsRegistering(true);
		setRegisterError("");

		try {
			if (
				!registerForm().firstName ||
				!registerForm().lastName ||
				!registerForm().email ||
				!registerForm().password
			) {
				throw new Error("Please fill in all required fields");
			}

			await axios.post("/api/auth/register", {
				email: registerForm().email,
				password: registerForm().password,
				firstName: registerForm().firstName,
				lastName: registerForm().lastName,
				phone: registerForm().phone,
				role: 'CUSTOMER',
			});

			// 
			// Notice: still need login
			//
			// localStorage.setItem(
			// 	"auth:user",
			// 	JSON.stringify({
			// 		id: ret.data.user.id,
			// 		email: ret.data.user.email,
			// 		token: ret.data.token,
			// 		refreshToken: ret.data.refreshToken,
			// 	}),
			// );
			alert("Registration successful! ");
		} catch (error: any) {
			// Handle new error response format
			const errorMessage = error.response?.data?.error?.message 
				|| error.response?.data?.error 
				|| error.message 
				|| "Registration failed. Please try again.";
			setRegisterError(errorMessage);
			console.error("Registration error:", error);
		} finally {
			setIsRegistering(false);
		}
	};

	return (
		<div class="p-8 space-y-8">
			<div class="flex flex-col lg:flex-row gap-8 lg:w-1/2 mx-auto">
				{/* Login Form */}
				<div class="bg-gray-50 rounded-lg p-6 flex-1 shadow-md border border-gray-100">
					<h2 class="text-2xl font-bold text-gray-800 text-center mb-6">
						Login
					</h2>

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
								Email Address
							</label>
							<input
								type="email"
								id="loginEmail"
								value={loginForm().email}
								onInput={(e) =>
									handleLoginInputChange("email", e.currentTarget.value)
								}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
								placeholder="you@example.com"
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
								placeholder="••••••••"
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
							{isLoggingIn() ? "Logging in..." : "Log In"}
						</button>
					</form>
				</div>

				{/* Register Form */}
				<div class="bg-gray-50 rounded-lg p-6 flex-1 shadow-md border border-gray-100">
					<h2 class="text-2xl font-bold text-gray-800 text-center mb-6">
						Register
					</h2>

					{registerError() && (
						<div class="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
							{registerError()}
						</div>
					)}

					<form onSubmit={handleRegisterSubmit} class="space-y-6">
						<div>
							<label
								for="registerEmail"
								class="block text-sm font-medium text-gray-700"
							>
								Email Address
							</label>
							<input
								type="email"
								id="registerEmail"
								value={registerForm().email}
								onInput={(e) =>
									handleRegisterInputChange("email", e.currentTarget.value)
								}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
								placeholder="you@example.com"
								required
							/>
						</div>
						<div>
							<label
								for="registerPassword"
								class="block text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<input
								type="password"
								id="registerPassword"
								value={registerForm().password}
								onInput={(e) =>
									handleRegisterInputChange("password", e.currentTarget.value)
								}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
								placeholder="••••••••"
								required
							/>
						</div>
						<div>
							<label
								for="registerFirstName"
								class="block text-sm font-medium text-gray-700"
							>
								First Name
							</label>
							<input
								type="text"
								id="registerFirstName"
								value={registerForm().firstName}
								onInput={(e) =>
									handleRegisterInputChange("firstName", e.currentTarget.value)
								}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
								placeholder="John Doe"
								required
							/>
						</div>
						<div>
							<label
								for="registerLastName"
								class="block text-sm font-medium text-gray-700"
							>
								Last Name
							</label>
							<input
								type="text"
								id="registerLastName"
								value={registerForm().lastName}
								onInput={(e) =>
									handleRegisterInputChange("lastName", e.currentTarget.value)
								}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
								placeholder="John Doe"
								required
							/>
						</div>
						<div>
							<label
								for="registerPhone"
								class="block text-sm font-medium text-gray-700"
							>
								Phone Number
							</label>
							<input
								type="tel"
								id="registerPhone"
								value={registerForm().phone}
								onInput={(e) =>
									handleRegisterInputChange("phone", e.currentTarget.value)
								}
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition"
								placeholder="+1 (555) 123-4567"
							/>
						</div>

						<button
							type="submit"
							disabled={isRegistering()}
							classList={{
								"w-full px-6 py-3 rounded-full font-semibold shadow-md transition": true,
								"bg-blue-600 text-white hover:bg-blue-700": !isRegistering(),
								"bg-blue-400 cursor-not-allowed": isRegistering(),
							}}
						>
							{isRegistering() ? "Registering..." : "Register"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
