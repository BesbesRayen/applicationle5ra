import { AppRegistry } from "react-native";
import App from "./App.tsx";
import "./index.css";

AppRegistry.registerComponent("Main", () => App);

const rootTag = document.getElementById("root");

if (!rootTag) {
	throw new Error("Root element not found");
}

AppRegistry.runApplication("Main", {
	rootTag,
});
