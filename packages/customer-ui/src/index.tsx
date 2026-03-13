/* @refresh reload */
import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import "./index.css";

import { Employee } from "./pages/Employee.tsx";
import { Home } from "./pages/Home.tsx";
import { LogReg } from "./pages/LogReg.tsx";
import { Login } from "./pages/Login.tsx";
import { Register } from "./pages/Register.tsx";

const root = document.getElementById("root");

render(
	() => (
		<Router>
            <Route path="/logreg" component={LogReg} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />

			<Route path="/" component={Home} />
			<Route path="/employee" component={Employee} />
		</Router>
	),
	root!,
);
