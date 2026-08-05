import { createBrowserRouter, type RouteObject } from "react-router";
import Home from "../pages/Home";

const routeConfig: RouteObject[] = [
  {
    path: "/",
    Component: Home,
  },
];

export const browserRouter = createBrowserRouter(routeConfig);
