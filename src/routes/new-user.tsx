import { createFileRoute } from "@tanstack/react-router";
import { NewUserPage } from "@/pages/new-user/NewUserPage";

export const Route = createFileRoute("/new-user")({
  head: () => ({
    meta: [{ title: "New user | PPC Zimbabwe Online Store" }],
  }),
  component: NewUserPage,
});
