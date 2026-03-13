import { GuestView } from "../components/GuestView";
import { MyHeader } from "../components/MyHeader";

export function Home() {
    return (
        <div>
			<MyHeader />
            <GuestView />
        </div>
    )
}