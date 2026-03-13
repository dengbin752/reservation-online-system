import type { ParentComponent } from "solid-js";
import "./App.css";

const App: ParentComponent = (props) => {
  return (
    <div class="app">
      {props.children}
    </div>
  );
};

export default App;
