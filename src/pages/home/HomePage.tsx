import { useState, type ChangeEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock3,
  Search,
  ShieldCheck,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import logoImage from "@/assets/logo.jpg";
import heroImage from "@/assets/top_right.png";
import surebuildImage from "@/assets/surebuild.jpg";
import surecastImage from "@/assets/surecast.jpg";
import surecemImage from "@/assets/surecem.jpg";
import { Button } from "@/components/ui/button";
import { PRODUCTS, type Product } from "@/features/store/products";

type HomepageProduct = {
  id: string;
  image: string;
  description: string;
};

const HOMEPAGE_PRODUCTS: HomepageProduct[] = [
  {
    id: "surebuild-42-5n",
    image: surebuildImage,
    description: "High strength for demanding construction projects.",
  },
  {
    id: "surecem-32-5n",
    image: surecemImage,
    description: "Ideal for general building and construction work.",
  },
  {
    id: "surecast-42-5r",
    image: surecastImage,
    description: "Fast setting and high early strength for specialised applications.",
  },
];

const BENEFITS = [
  {
    Icon: ShieldCheck,
    title: "Quality you can trust",
    description: "PPC cement. Built for a stronger tomorrow.",
  },
  {
    Icon: Truck,
    title: "Convenient ordering",
    description: "Shop online. It's quick and simple.",
  },
  {
    Icon: Clock3,
    title: "Reliable delivery",
    description: "We get your cement to you.",
  },
  {
    Icon: Users,
    title: "Stronger communities",
    description: "Building Zimbabwe, together.",
  },
];

export function HomePage() {
  const [search, setSearch] = useState("");
  const searchTerm = search.trim().toLocaleLowerCase();

  const visibleProducts = HOMEPAGE_PRODUCTS.filter((item) => {
    const product = PRODUCTS.find((entry) => entry.id === item.id);
    return (
      product &&
      `${product.name} ${product.grade} ${product.strengthClass} ${item.description}`
        .toLocaleLowerCase()
        .includes(searchTerm)
    );
  });

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.currentTarget.value);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#17212B]">
      <div
        aria-label="Strength guaranteed"
        className="flex h-10 items-center justify-center bg-[#E30613] px-4 text-white"
      >
        <div className="flex w-full max-w-sm items-center gap-4">
          <span aria-hidden="true" className="h-px flex-1 bg-white/55" />
          <span className="whitespace-nowrap text-xs font-extrabold tracking-[0.24em] sm:text-sm">
            STRENGTH GUARANTEED
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-white/55" />
        </div>
      </div>

      <header className="relative z-20 border-b border-[#E5EAF0] bg-white">
        <div className="grid min-h-[82px] w-full grid-cols-[70px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3 pr-[1cm] sm:px-6 sm:pr-[1cm] min-[1000px]:grid-cols-[76px_minmax(0,1fr)_auto] min-[1000px]:gap-4 min-[1000px]:py-0 min-[1000px]:pl-6 min-[1000px]:pr-[1cm] min-[1600px]:gap-6 min-[1600px]:pl-14 min-[1600px]:pr-[1cm]">
          <Link
            to="/"
            aria-label="PPC Zimbabwe home"
            className="col-start-1 row-start-1 flex h-[68px] w-[68px] items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613] min-[1200px]:h-[76px] min-[1200px]:w-[76px]"
          >
            <img
              src={logoImage}
              alt="PPC Strength Guaranteed"
              className="h-full w-full object-contain"
            />
          </Link>

          <nav
            aria-label="Main navigation"
            className="col-span-2 row-start-2 flex min-w-0 items-center justify-center gap-3 pb-1 text-sm font-semibold tracking-[0.06em] text-[#17212B] sm:gap-7 min-[1000px]:col-start-2 min-[1000px]:col-span-1 min-[1000px]:row-start-1 min-[1000px]:justify-start min-[1000px]:gap-[0.85cm] min-[1000px]:pb-0 min-[1000px]:text-lg"
          >
            <Link
              to="/"
              aria-current="page"
              className="relative whitespace-nowrap py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
            >
              Home
            </Link>
            <Link
              to="/buy"
              className="whitespace-nowrap py-2 transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
            >
              Buy Cement
            </Link>
            <a
              href="#order-help"
              className="whitespace-nowrap py-2 text-[#40536A] transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
            >
              Help
            </a>
          </nav>

          <div className="col-span-2 row-start-3 flex min-w-0 flex-wrap items-center justify-end gap-3 min-[1000px]:col-start-3 min-[1000px]:col-span-1 min-[1000px]:row-start-1 min-[1000px]:flex-nowrap min-[1000px]:gap-[0.85cm]">
            <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 rounded-full border border-[#E5EAF0] bg-white px-3.5 text-[#718096] transition-colors focus-within:border-[#E30613] focus-within:ring-2 focus-within:ring-[#E30613]/15 min-[1000px]:h-10 min-[1000px]:w-[250px] min-[1000px]:min-w-[250px] min-[1000px]:flex-none min-[1000px]:px-3">
              <Search aria-hidden="true" className="size-[18px] shrink-0 text-[#718096]" />
              <input
                aria-label="Search cement products"
                type="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search cement products..."
                className="min-w-0 flex-1 bg-transparent text-base tracking-[0.025em] text-[#17212B] outline-none placeholder:text-[#718096]"
              />
            </label>
            <div className="flex shrink-0 items-center gap-[0.85cm] text-base font-semibold tracking-[0.07em] text-[#40536A]">
              <Link
                to="/login"
                className="whitespace-nowrap transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
              >
                Log in
              </Link>
              <Link
                to="/new-user"
                className="whitespace-nowrap transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
              >
                New user
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section
          aria-labelledby="home-heading"
          className="relative isolate grid grid-cols-1 overflow-hidden border-b border-[#E5EAF0] bg-white md:block"
        >
          <div className="relative z-10 flex min-h-[350px] w-full items-center px-5 py-8 sm:px-8 md:px-10 md:py-6 min-[1200px]:px-[8vw] min-[1600px]:px-[9vw]">
            <div className="relative z-10 max-w-[760px] tracking-[0.075em] md:w-1/2 md:max-w-none md:translate-x-[12vw] min-[1200px]:translate-x-[16vw]">
              <p className="mb-3 text-base font-extrabold tracking-[0.24em] text-[#E30613]">
                PPC ZIMBABWE
              </p>
              <h1
                id="home-heading"
                className="whitespace-nowrap text-[clamp(2.5rem,6vw,4.75rem)] font-black leading-[1.02] tracking-[0.025em] text-[#17212B]"
              >
                Online <span className="text-[#E30613]">Store</span>
              </h1>
              <p className="mt-5 max-w-[700px] text-base leading-7 tracking-[0.075em] text-[#40536A] sm:text-lg">
                Premium cement products for your construction projects.
                <br className="hidden sm:block" />
                Quality, reliability and strength — delivered to your door.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-5">
                <Button
                  variant="hero"
                  size="lg"
                  asChild
                  className="h-16 min-w-[250px] justify-between rounded-lg px-6 text-base font-bold tracking-[0.04em]"
                >
                  <Link to="/buy">
                    Buy Cement <ArrowRight aria-hidden="true" className="size-[18px]" />
                  </Link>
                </Button>
                <div className="hidden h-10 w-px bg-[#D8DEE6] sm:block" />
                <div className="flex items-center gap-2.5">
                  <ShieldCheck aria-hidden="true" className="size-9 shrink-0 text-[#E30613]" />
                  <p className="text-sm leading-[1.45] tracking-[0.045em] text-[#40536A]">
                    Genuine
                    <br />
                    PPC Products
                  </p>
                </div>
                <div className="hidden h-10 w-px bg-[#D8DEE6] sm:block" />
                <div className="flex items-center gap-2.5">
                  <Truck aria-hidden="true" className="size-9 shrink-0 text-[#E30613]" />
                  <p className="text-sm leading-[1.45] tracking-[0.045em] text-[#40536A]">
                    Reliable
                    <br />
                    Delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
          <img
            src={heroImage}
            alt="PPC SureBuild, SURECEM and SURECAST cement bags with PPC red diagonal artwork"
            className="relative block h-auto max-h-[220px] w-full object-contain md:absolute md:right-0 md:top-0 md:h-full md:max-h-none md:w-1/2 md:object-right-top"
            style={{ objectPosition: "right top" }}
          />
        </section>

        <section
          id="products"
          aria-labelledby="products-heading"
          className="w-full px-4 py-7 sm:px-6 md:px-8 min-[1200px]:px-10 min-[1600px]:px-14"
        >
          <h2 id="products-heading" className="sr-only">
            PPC cement products and ordering
          </h2>
          <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-stretch gap-5 min-[560px]:grid-cols-2 min-[1200px]:grid-cols-3 min-[1200px]:gap-6">
            {visibleProducts.map((item) => {
              const product = PRODUCTS.find((entry) => entry.id === item.id);
              if (!product) return null;

              return (
                <HomepageProductCard
                  key={product.id}
                  product={product}
                  image={item.image}
                  description={item.description}
                />
              );
            })}

            {visibleProducts.length === 0 && (
              <p
                role="status"
                className="rounded-lg border border-[#E5EAF0] bg-white p-6 text-base text-[#40536A] min-[560px]:col-span-2 min-[1200px]:col-span-3"
              >
                No cement products match “{search}”. Try another search.
              </p>
            )}

            <aside
              id="place-order"
              aria-labelledby="order-heading"
              className="col-span-full flex min-h-[260px] w-full flex-col rounded-lg bg-[#FCF6F7] p-5 sm:p-6 min-[1200px]:p-6"
            >
              <h2
                id="order-heading"
                className="text-[28px] font-extrabold leading-tight text-[#17212B]"
              >
                Place an order
              </h2>
              <p className="mt-3 text-base leading-[1.6] text-[#718096]">
                Select your preferred cement products, add to your order and proceed to make your
                order.
              </p>
              <Link
                to="/buy"
                className="mt-6 inline-flex min-h-[60px] w-full items-center justify-between gap-2 rounded-lg bg-[#E30613] px-4 text-base font-bold text-white transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#17212B]"
              >
                <span>Proceed to make an order</span>
                <ArrowRight aria-hidden="true" className="size-[18px] shrink-0" />
              </Link>
              <div
                id="delivery-info"
                className="mt-auto flex items-center gap-3 border-t border-[#E5EAF0] pt-4"
              >
                <Truck aria-hidden="true" className="size-7 shrink-0 text-[#40536A]" />
                <p id="order-help" className="text-sm leading-[1.5] text-[#718096]">
                  Your order will be processed and delivered to your location.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section
          aria-label="PPC Zimbabwe benefits"
          className="border-t border-[#E5EAF0] bg-[#F5F7FA]"
        >
          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 px-5 py-5 min-[520px]:grid-cols-2 sm:px-8 sm:py-7 min-[1200px]:grid-cols-4 min-[1200px]:px-10 min-[1200px]:py-9 min-[1600px]:px-14">
            {BENEFITS.map(({ Icon, title, description }, index) => (
              <div
                key={title}
                className={`flex min-h-[112px] items-start gap-4 border-b border-[#DDE3EA] py-5 first:pt-2 last:border-b-0 last:pb-2 min-[520px]:px-5 min-[520px]:first:pl-0 min-[520px]:last:pr-0 min-[1200px]:min-h-[120px] min-[1200px]:border-b-0 min-[1200px]:border-r min-[1200px]:py-3 min-[1200px]:last:border-r-0 min-[1200px]:last:pr-0 ${index === 1 ? "min-[520px]:border-b-0" : ""} ${index === 2 ? "min-[520px]:border-b-0" : ""}`}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#C90016] ring-1 ring-[#E5EAF0]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#17212B]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#718096]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t-4 border-[#E30613] bg-[#17212B] text-white">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-5 py-9 sm:px-8 sm:py-11 min-[720px]:grid-cols-2 min-[1200px]:grid-cols-[1.15fr_1.2fr_1fr_1.7fr] min-[1200px]:gap-10 min-[1200px]:px-10 min-[1600px]:px-14">
          <div className="flex items-start gap-4">
            <span className="flex h-[68px] w-[100px] shrink-0 items-center justify-center rounded-md bg-white px-2">
              <img
                src={logoImage}
                alt="PPC Strength Guaranteed"
                className="max-h-full max-w-full object-contain"
              />
            </span>
            <div className="pt-1">
              <p className="text-lg font-bold tracking-wide">PPC Zimbabwe</p>
              <p className="mt-1 text-sm leading-6 text-white/70">Building a stronger tomorrow.</p>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-white/65">
              Tel
            </h2>
            <p className="text-base leading-7">
              <a
                className="transition-colors hover:text-[#F7A1A6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="tel:+2638677004215"
              >
                +263 867 700 4215
              </a>
              <span className="text-white/60"> / </span>
              <a
                className="transition-colors hover:text-[#F7A1A6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                href="tel:+2632922792419"
              >
                +263 292 279 2419
              </a>
            </p>
          </div>
          <div className="min-w-0">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-white/65">
              Email
            </h2>
            <a
              className="break-words text-base transition-colors hover:text-[#F7A1A6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href="mailto:sales@ppc.co.zw"
            >
              sales@ppc.co.zw
            </a>
          </div>
          <div className="min-w-0">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-white/65">
              Address
            </h2>
            <address className="text-base not-italic leading-7 text-white/90">
              Bulawayo Sales Office, Cnr J.M.N. Nkomo Street &amp; 13th Avenue, Bulawayo, Zimbabwe
            </address>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-5 py-4 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between sm:px-8 min-[1200px]:px-10 min-[1600px]:px-14">
            <span>PPC Zimbabwe Online Store</span>
            <span>
              © {new Date().getFullYear()} PPC Zimbabwe Online Store. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe("HomePage", () => {
    async function renderHomePage() {
      const [{ renderToStaticMarkup }, { CartProvider }] = await Promise.all([
        import("react-dom/server"),
        import("@/features/store/cart"),
      ]);
      return renderToStaticMarkup(
        <CartProvider>
          <HomePage />
        </CartProvider>,
      );
    }

    it("renders the announcement, navigation, hero, products, order panel, and benefits", async () => {
      const html = await renderHomePage();

      for (const text of [
        "STRENGTH GUARANTEED",
        "Home",
        "Buy Cement",
        "Help",
        "Log in",
        "New user",
        "PPC ZIMBABWE",
        "Online",
        "Store",
        "Premium cement products for your construction projects.",
        "SURECEM 32,5N",
        "SureBuild 42,5N",
        "SURECAST 42,5R",
        "Place an order",
        "Proceed to make an order",
        "Quality you can trust",
        "Convenient ordering",
        "Reliable delivery",
        "Stronger communities",
      ]) {
        expect(html).toContain(text);
      }
      expect(html.match(/href="\/buy"/g)).toHaveLength(6);
      expect(html).toContain('href="/"');
      expect(html).not.toContain('href="/cart"');
      expect(html).toContain('href="/login"');
      expect(html).toContain('href="/new-user"');
      expect(html.indexOf('placeholder="Search cement products..."')).toBeLessThan(
        html.indexOf(">Log in</a>"),
      );
      expect(html.indexOf(">Log in</a>")).toBeLessThan(html.indexOf(">New user</a>"));
    });

    it("keeps cart contents off the homepage and routes buying actions to /buy", async () => {
      const html = await renderHomePage();

      expect(html.match(/href="\/buy"/g)).toHaveLength(6);
      expect(html).not.toContain('href="/cart"');
      expect(html).not.toContain("Your Cart");
      expect(html).not.toContain("in cart");
      expect(html).not.toContain("Cart, 0 bags");
      expect(html).not.toContain("Your trusted PPC Zimbabwe");
      expect(html).not.toContain("Add to order");
      expect(html).not.toContain("Decrease SURECEM quantity");
      expect(html).not.toContain("Increase SURECEM quantity");
    });
  });
}

function HomepageProductCard({
  product,
  image,
  description,
}: {
  product: Product;
  image: string;
  description: string;
}) {
  return (
    <article className="flex min-h-[430px] flex-col rounded-lg border border-[#E5EAF0] bg-white p-4 shadow-[0_2px_10px_rgba(23,33,43,0.04)] sm:p-5">
      <div className="flex h-[250px] w-full shrink-0 items-center justify-center overflow-hidden">
        <img
          src={image}
          alt={`${product.name} ${product.grade} PPC cement bag`}
          className={`h-full w-full object-contain object-center ${
            product.id === "surecem-32-5n" ? "scale-[1.04]" : "scale-[1.12]"
          }`}
        />
      </div>
      <h3 className="mt-3 text-center text-lg font-extrabold text-[#40536A]">
        {product.name} {product.grade}
      </h3>
      <p className="mt-1 min-h-[50px] text-center text-sm leading-[1.55] text-[#718096]">
        {description}
      </p>
      <div className="mt-auto flex justify-center pt-3">
        <Link
          to="/buy"
          aria-label={`Buy ${product.name} ${product.grade}`}
          className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 rounded-full bg-[#E30613] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212B]"
        >
          Buy
        </Link>
      </div>
    </article>
  );
}
