import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PPC Zimbabwe Online Store — Buy Cement Online" },
      {
        name: "description",
        content:
          "Shop SURECEM, SureBuild and SURECAST cement online. Choose delivery or collection and order direct from PPC Zimbabwe.",
      },
      { property: "og:title", content: "PPC Zimbabwe Online Store — Buy Cement Online" },
      {
        property: "og:description",
        content: "Choose your PPC cement, place your order and get on with the build.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});
