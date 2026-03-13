import { useNavigate } from "@solidjs/router";
import axios from "axios";
import { createSignal } from "solid-js";

interface RegisterForm {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	phone: string;
}

// 邮箱格式验证
const validateEmail = (email: string): string => {
	if (!email) return "";
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return "Please enter a valid email address";
	}
	return "";
};

// 手机号码格式验证（中国大陆手机号码 + 国际格式）
const validatePhone = (phone: string): string => {
	if (!phone) return "";

	// 中国大陆手机号码: 11位，以1开头，第二位3-9
	// 支持格式: 13800000000, +86 13800000000, +86-13800000000
	const chinaPhoneRegex = /^(\+86)?1[3-9]\d{9}$/;
	// 国际格式: +国家号 + 手机号
	const internationalPhoneRegex = /^\+\d{1,3}\s?\d{4,14}$/;

	if (chinaPhoneRegex.test(phone.replace(/\s/g, ''))) {
		return "";
	}

	if (internationalPhoneRegex.test(phone.replace(/\s/g, ''))) {
		return "";
	}

	return "Please enter a valid phone number";
};

export function RegisterForm() {
	const navigate = useNavigate();

	const [registerForm, setRegisterForm] = createSignal<RegisterForm>({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		phone: "",
	});

	const [registerError, setRegisterError] = createSignal("");
	const [isRegistering, setIsRegistering] = createSignal(false);

	// 验证错误状态
	const [emailError, setEmailError] = createSignal("");
	const [phoneError, setPhoneError] = createSignal("");

	// 邮箱失去焦点时验证
	const handleEmailBlur = () => {
		const error = validateEmail(registerForm().email);
		setEmailError(error);
	};

	// 手机号失去焦点时验证
	const handlePhoneBlur = () => {
		const error = validatePhone(registerForm().phone);
		setPhoneError(error);
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

			// 如果填写了手机号，进行格式验证
			if (registerForm().phone) {
				const phoneError = validatePhone(registerForm().phone);
				if (phoneError) {
					throw new Error(phoneError);
				}
			}

			await axios.post("/api/auth/register", {
				email: registerForm().email,
				password: registerForm().password,
				firstName: registerForm().firstName,
				lastName: registerForm().lastName,
				phone: registerForm().phone,
				role: 'CUSTOMER',
			});

			alert("Registration successful! Please log in.");
			navigate("/login");
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
		<div class="bg-gray-50 rounded-lg p-6 shadow-md border border-gray-100 lg:w-1/2 mx-auto">
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
						onBlur={handleEmailBlur}
						classList={{
							"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition": true,
							"border-red-500 focus:border-red-300 focus:ring-red-200": !!emailError(),
						}}
						placeholder="you@example.com"
						required
					/>
					{emailError() && (
						<p class="mt-1 text-sm text-red-600">{emailError()}</p>
					)}
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
						placeholder="John"
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
						placeholder="Doe"
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
						onBlur={handlePhoneBlur}
						classList={{
							"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition": true,
							"border-red-500 focus:border-red-300 focus:ring-red-200": !!phoneError(),
						}}
						placeholder="13800000000"
					/>
					{phoneError() && (
						<p class="mt-1 text-sm text-red-600">{phoneError()}</p>
					)}
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

			<div class="mt-6 text-center">
				<p class="text-gray-600">
					Already have an account?{" "}
					<a
						href="/login"
						class="text-blue-600 hover:text-blue-700 font-semibold"
					>
						Login
					</a>
				</p>
			</div>
		</div>
	);
}
