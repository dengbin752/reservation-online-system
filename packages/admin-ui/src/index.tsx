/* @refresh reload */
import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import "./index.css";

import { AdminLogin } from "./pages/AdminLogin.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";

const root = document.getElementById("root");

render(
	() => (
		<Router>
			<Route path="/admin/login" component={AdminLogin} />
			<Route path="/dashboard" component={Dashboard} />
			<Route path="/" component={AdminLogin} />
		</Router>
	),
	root!,
);
