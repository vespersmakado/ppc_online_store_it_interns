import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Log in | PPC Zimbabwe Online Store" }],
  }),
  component: LoginPage,
});
