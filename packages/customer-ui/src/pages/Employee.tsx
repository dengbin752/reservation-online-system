import { EmployeeView } from "../components/EmployeeView";
import { MyHeader } from "../components/MyHeader";

export function Employee() {
    return (
        <div>
			<MyHeader />
            <EmployeeView />
        </div>
    )
}