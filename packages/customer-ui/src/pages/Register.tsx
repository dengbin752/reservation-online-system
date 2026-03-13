import { RegisterForm } from "../components/RegisterForm";
import { MyHeader } from "../components/MyHeader";

export function Register() {
    return (
        <div>
            <MyHeader />
            <div class="p-8">
                <RegisterForm />
            </div>
        </div>
    )
}
