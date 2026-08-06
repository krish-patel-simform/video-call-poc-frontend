import { createBrowserRouter, type RouteObject } from "react-router";
import Home from "../pages/Home";
import RoomPage from "../pages/RoomPage";

const routeConfig: RouteObject[] = [
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/room/:roomId",
    Component: RoomPage,
  },
];

export const browserRouter = createBrowserRouter(routeConfig);
