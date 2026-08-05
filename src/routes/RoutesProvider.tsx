import { RouterProvider } from "react-router";
import { browserRouter } from "./routesConfig";

export default function RoutesProvider() {
  return <RouterProvider router={browserRouter} />;
}
