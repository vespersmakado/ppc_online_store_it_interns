import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe("App routing", () => {
    it("matches a page for / instead of falling back to not found", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/");

      expect(matches.at(-1)?.routeId).not.toBe("__root__");
    });

    it("matches the cart page at /cart", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/cart");

      expect(matches.at(-1)?.routeId).toBe("/cart");
    });

    it("matches the buy page at /buy", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/buy");

      expect(matches.at(-1)?.routeId).toBe("/buy");
    });

    it("matches the login page at /login", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/login");

      expect(matches.at(-1)?.routeId).toBe("/login");
    });

    it("matches the new user page at /new-user", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/new-user");

      expect(matches.at(-1)?.routeId).toBe("/new-user");
    });

    it("matches the quotation page at /view-order", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/view-order");

      expect(matches.at(-1)?.routeId).toBe("/view-order");
    });

    it("matches the payment page at /payment", () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      const matches = router.matchRoutes("/payment");

      expect(matches.at(-1)?.routeId).toBe("/payment");
    });
  });
}
