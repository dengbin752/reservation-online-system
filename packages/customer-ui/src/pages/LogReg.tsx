import { LoginForm } from "../components/LoginForm";
import { MyHeader } from "../components/MyHeader";

export function LogReg() {
    return (
        <div>
            <MyHeader />
            <div class="p-8">
                <LoginForm />
            </div>
        </div>
    )
}