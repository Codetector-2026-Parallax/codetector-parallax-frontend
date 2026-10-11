import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  lazyRouteComponent,
  ScrollRestoration,
} from "@tanstack/react-router"
import BackgroundOverlay from "./components/shared/BackgroundOverlay"

const rootRoute = createRootRoute({
  component: () => (
    <div className="relative min-h-screen text-foreground">
      <BackgroundOverlay />
      <ScrollRestoration />
      <Outlet />
    </div>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./pages/LandingPage")),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: lazyRouteComponent(() => import("./pages/LoginPage")),
})

const emptyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/empty",
  component: lazyRouteComponent(() => import("./pages/EmptyPage")),
})

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game",
  component: lazyRouteComponent(() => import("./pages/GameWorkspacePage")),
})

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: lazyRouteComponent(() => import("./pages/LeaderboardPage")),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  emptyRoute,
  gameRoute,
  leaderboardRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadDelay: 50,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
