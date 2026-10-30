import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Search,
  Truck,
  UserRound,
  UserRoundPlus,
  Warehouse,
} from "lucide-react";
import logoImage from "@/assets/logo.jpg";
import surebuildImage from "@/assets/surebuild.jpg";
import surecastImage from "@/assets/surecast.jpg";
import surecemImage from "@/assets/surecem.jpg";
import { useCart } from "@/features/store/cart";
import { useDemoAccount } from "@/features/account/demo-account";
import type { FulfilmentMethod } from "@/features/store/products";

const BUY_PRODUCTS = [
  {
    id: "surecem-32-5n",
    name: "SURECEM 32,5N",
    description: "Ideal for general building and construction work.",
    image: surecemImage,
  },
  {
    id: "surebuild-42-5n",
    name: "SureBuild 42,5N",
    description: "High strength for demanding construction projects.",
    image: surebuildImage,
  },
  {
    id: "surecast-42-5r",
    name: "SURECAST 42,5R",
    description: "Fast setting and high early strength for specialised applications.",
    image: surecastImage,
  },
] as const;

const FULFILMENT_OPTIONS: {
  value: FulfilmentMethod;
  title: string;
  description: string;
  minimum: number;
  Icon: typeof Truck;
}[] = [
  {
    value: "collect",
    title: "Collect",
    description: "Collect your cement from the designated collection point.",
    minimum: 40,
    Icon: Warehouse,
  },
  {
    value: "delivery",
    title: "Deliver",
    description: "Have your cement delivered to your location.",
    minimum: 200,
    Icon: Truck,
  },
];

type AccountType = "existing" | "new";

export function BuyPage() {
  const navigate = useNavigate();
  const { bags, method, methodSelected, qtyOf, setMethod, setQty, priceChanges, refreshPrices } =
    useCart();
  const { isCustomerAuthenticated, authenticate } = useDemoAccount();
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [proceedMessage, setProceedMessage] = useState("");
  const selectedMethod = methodSelected ? method : null;
  const selectedFulfilment =
    selectedMethod === "collect"
      ? FULFILMENT_OPTIONS[0]
      : selectedMethod === "delivery"
        ? FULFILMENT_OPTIONS[1]
        : null;
  const minimumBags = selectedFulfilment?.minimum ?? null;
  const remainingBags = minimumBags === null ? null : Math.max(minimumBags - bags, 0);
  const progress = minimumBags === null ? 0 : Math.min((bags / minimumBags) * 100, 100);
  const eligible = minimumBags !== null && bags >= minimumBags;
  const visibleProducts = BUY_PRODUCTS.filter((product) =>
    product.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const hasProducts = BUY_PRODUCTS.some((product) => qtyOf(product.id) > 0);
  const quantitiesAreValid = BUY_PRODUCTS.every((product) => qtyOf(product.id) % 40 === 0);

  const handleAccountLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setAccountMessage(
        "Enter both your username and password to link the development demo account.",
      );
      return;
    }
    try {
      const result = await authenticate(username, password);
      setPassword("");
      setAccountMessage(
        result === "authenticated"
          ? "Customer details verified successfully, you can proceed to view order."
          : result === "disabled"
            ? "Sign-in is temporarily unavailable. Please contact the site administrator."
            : "The account details were not recognised. No account has been linked.",
      );
    } catch (error) {
      console.error("Could not link the customer account on the Buy page.", error);
      setPassword("");
      setAccountMessage(
        "Sign-in could not be completed. Please check your connection and try again.",
      );
    }
  };

  const handleNewAccount = () => {
    if (!selectedMethod) {
      setAccountMessage("Choose Collect or Deliver before continuing to registration.");
      return;
    }
    if (!hasProducts) {
      setAccountMessage("Add at least one cement product before continuing to registration.");
      return;
    }
    setAccountMessage(
      "Your cart is saved in this browser. You can complete the registration form, but online submission is not available yet.",
    );
    void navigate({ to: "/new-user" });
  };

  const handleProceed = () => {
    if (!selectedMethod) {
      setProceedMessage("Choose Collect or Deliver to continue.");
      return;
    }
    if (!hasProducts) {
      setProceedMessage("Add at least one cement product to your order.");
      return;
    }
    if (!quantitiesAreValid) {
      setProceedMessage("Every product quantity must be a multiple of 40 bags.");
      return;
    }
    if (!eligible) {
      setProceedMessage(
        `Your ${selectedFulfilment?.title.toLowerCase() ?? "selected"} order needs ${remainingBags} more bags.`,
      );
      return;
    }
    if (accountType === "existing" && isCustomerAuthenticated) {
      void navigate({ to: "/view-order" });
      return;
    }
    setProceedMessage(
      accountType === "existing"
        ? "Link the development demo account before proceeding to the quotation."
        : "Complete new-account registration before you can proceed to the quotation.",
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#17212B]">
      <div
        aria-label="Strength guaranteed"
        className="flex h-10 items-center justify-center bg-[#E30613] px-4 text-white"
      >
        <div className="flex w-full max-w-sm items-center gap-4">
          <span aria-hidden="true" className="h-px flex-1 bg-white/55" />
          <span className="whitespace-nowrap text-sm font-extrabold tracking-[0.24em] sm:text-base">
            STRENGTH GUARANTEED
          </span>
          <span aria-hidden="true" className="h-px flex-1 bg-white/55" />
        </div>
      </div>

      <header className="relative z-20 border-b border-[#E5EAF0] bg-white">
        <div className="mx-auto flex min-h-[92px] w-full max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 min-[1200px]:flex-nowrap min-[1200px]:px-10 min-[1600px]:px-14">
          <Link
            to="/"
            aria-label="PPC Zimbabwe home"
            className="flex h-[76px] w-[76px] shrink-0 items-center justify-center"
          >
            <img
              src={logoImage}
              alt="PPC Strength Guaranteed"
              className="h-full w-full object-contain"
            />
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex flex-1 items-center justify-center gap-4 text-sm font-semibold tracking-[0.04em] text-[#17212B] sm:gap-6 sm:text-base min-[1200px]:justify-start min-[1200px]:gap-7"
          >
            <Link to="/" className="whitespace-nowrap hover:text-[#E30613]">
              Home
            </Link>
            <Link to="/buy" aria-current="page" className="whitespace-nowrap text-[#E30613]">
              Buy Cement
            </Link>
            <a href="/#order-help" className="whitespace-nowrap hover:text-[#E30613]">
              Help
            </a>
          </nav>
          <label className="flex h-12 min-w-[180px] flex-1 items-center gap-2 rounded-full border border-[#E5EAF0] px-3 text-[#718096] focus-within:border-[#E30613] min-[1200px]:max-w-[280px]">
            <Search aria-hidden="true" className="size-5 shrink-0" />
            <input
              aria-label="Search cement products"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search cement products..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#17212B] outline-none placeholder:text-[#718096]"
            />
          </label>
          <div className="flex shrink-0 items-center gap-4 text-sm font-semibold text-[#40536A] sm:text-base">
            <Link to="/login" className="whitespace-nowrap hover:text-[#E30613]">
              Log in
            </Link>
            <Link to="/new-user" className="whitespace-nowrap hover:text-[#E30613]">
              New user
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full px-5 py-10 text-base sm:px-8 sm:py-12 lg:px-12 2xl:px-16">
        <div className="mb-10 rounded-2xl border border-[#E5EAF0] bg-gradient-to-r from-[#FCF6F7] to-white p-8 text-center shadow-[0_8px_30px_rgba(23,33,43,0.05)] sm:p-10">
          <p className="mb-3 text-base font-extrabold uppercase tracking-[0.2em] text-[#E30613] sm:text-lg">
            PPC Zimbabwe Online Store
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17212B] sm:text-4xl">
            Load Your Cart
          </h1>
          <p className="mx-auto mt-4 max-w-none text-base leading-relaxed text-[#718096] sm:text-lg min-[1000px]:whitespace-nowrap">
            Choose your collection or delivery option, select your cement quantities, and prepare
            your order.
          </p>
        </div>

        {priceChanges.length > 0 && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <div>
              <p className="font-semibold">Current prices differ from this saved cart.</p>
              <ul className="mt-1 space-y-1 text-xs">
                {priceChanges.map((change) => (
                  <li key={change.productId}>
                    {BUY_PRODUCTS.find((product) => product.id === change.productId)?.name}: $
                    {(change.savedPriceCents / 100).toFixed(2)} saved → $
                    {(change.currentPriceCents / 100).toFixed(2)} current per bag.
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Update this saved cart to the current demonstration prices?")) {
                  refreshPrices();
                }
              }}
              className="rounded-md bg-[#E30613] px-4 py-2 font-semibold text-white hover:bg-[#C90016]"
            >
              Confirm price update
            </button>
          </div>
        )}

        <section aria-labelledby="fulfilment-heading" className="mb-9">
          <h2
            id="fulfilment-heading"
            className="mb-5 text-xl font-extrabold text-[#17212B] sm:text-2xl"
          >
            How would you like to receive your order?
          </h2>
          <fieldset>
            <legend className="sr-only">Choose Collect or Deliver</legend>
            <div className="grid gap-4 md:grid-cols-2">
              {FULFILMENT_OPTIONS.map(({ value, title, description, minimum, Icon }) => {
                const isSelected = selectedMethod === value;
                return (
                  <label
                    key={value}
                    className={`relative flex cursor-pointer gap-5 rounded-2xl border-2 p-6 shadow-[0_4px_18px_rgba(23,33,43,0.04)] transition-colors focus-within:ring-2 focus-within:ring-[#E30613]/30 sm:p-7 ${
                      isSelected
                        ? "border-[#E30613] bg-[#FCF6F7]"
                        : "border-[#E5EAF0] bg-white hover:border-[#E30613]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfilment"
                      value={value}
                      checked={isSelected}
                      onChange={() => setMethod(value)}
                      className="sr-only"
                    />
                    <Icon aria-hidden="true" className="mt-1 size-9 shrink-0 text-[#E30613]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold text-[#17212B] sm:text-xl">
                        {title}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-[#718096] sm:text-base">
                        {description}
                      </span>
                      <span className="mt-4 block text-sm font-bold text-[#40536A] sm:text-base">
                        Minimum order: {minimum} bags
                      </span>
                    </span>
                    {isSelected && (
                      <CheckCircle2
                        aria-label="Selected"
                        className="size-7 shrink-0 text-[#E30613]"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section aria-labelledby="products-heading" className="mb-8">
          <div className="mb-4">
            <h2 id="products-heading" className="text-xl font-extrabold text-[#17212B] sm:text-2xl">
              Your Cement Selection
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#718096] sm:text-base">
              Choose the quantities you need for each product. All quantities are ordered in
              multiples of 40 bags.
            </p>
          </div>
          <div className="space-y-5">
            {visibleProducts.map((product) => {
              const quantity = qtyOf(product.id);
              return (
                <article
                  key={product.id}
                  className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-5 rounded-2xl border border-[#E5EAF0] bg-white p-5 shadow-[0_5px_20px_rgba(23,33,43,0.05)] transition-shadow hover:shadow-[0_8px_26px_rgba(23,33,43,0.1)] sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:gap-8 sm:p-7"
                >
                  <div className="flex h-36 w-[132px] items-center justify-center sm:h-44 sm:w-[180px]">
                    <img
                      src={product.image}
                      alt={`${product.name} cement bag`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[#17212B] sm:text-xl">{product.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#718096] sm:text-base">
                      {product.description}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-4 border-t border-[#E5EAF0] pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
                    <span className="text-base font-medium text-[#40536A] sm:hidden">Quantity</span>
                    <div
                      className="inline-flex items-center gap-2 rounded-xl border border-[#E5EAF0] p-1.5"
                      aria-label={`${product.name} quantity controls`}
                    >
                      <button
                        type="button"
                        aria-label={`Remove 40 bags of ${product.name}`}
                        onClick={() => setQty(product.id, Math.max(0, quantity - 40))}
                        disabled={quantity < 40}
                        className="flex h-12 min-w-[82px] items-center justify-center gap-1.5 rounded-lg px-3 text-base font-bold text-[#40536A] transition-colors hover:bg-[#FCF6F7] hover:text-[#E30613] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus aria-hidden="true" className="size-4" />
                        <span>40</span>
                      </button>
                      <span
                        aria-live="polite"
                        aria-label={`${quantity} bags of ${product.name}`}
                        className="min-w-24 text-center text-lg font-extrabold tabular-nums text-[#17212B]"
                      >
                        {quantity}
                        <span className="ml-1 text-sm font-medium text-[#718096]">bags</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Add 40 bags of ${product.name}`}
                        onClick={() => setQty(product.id, quantity + 40)}
                        className="flex h-12 min-w-[82px] items-center justify-center gap-1.5 rounded-lg bg-[#E30613] px-3 text-base font-bold text-white transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212B]"
                      >
                        <Plus aria-hidden="true" className="size-4" />
                        <span>40</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {visibleProducts.length === 0 && (
              <p className="rounded-xl border border-[#E5EAF0] bg-[#FCF6F7] p-5 text-sm text-[#40536A] sm:text-base">
                No cement products match “{search}”. Clear the search to see all three products.
              </p>
            )}
          </div>
        </section>

        <section
          aria-labelledby="quantity-check-heading"
          className="mb-10 rounded-2xl border border-[#E5EAF0] bg-[#FCF6F7] p-6 shadow-[0_5px_20px_rgba(23,33,43,0.04)] sm:p-8"
        >
          <div className="flex items-start gap-3">
            <Package aria-hidden="true" className="mt-1 size-8 shrink-0 text-[#E30613]" />
            <div className="min-w-0 flex-1">
              <h2
                id="quantity-check-heading"
                className="text-xl font-extrabold text-[#17212B] sm:text-2xl"
              >
                Order Quantity Check
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#718096] sm:text-base">
                Your order must meet the minimum quantity for your selected collection or delivery
                method.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-semibold text-[#40536A] sm:text-base">
            <span>Total bags selected: {bags}</span>
            {minimumBags !== null ? (
              <span>Minimum required: {minimumBags} bags</span>
            ) : (
              <span>Select Collect or Deliver to see the minimum.</span>
            )}
          </div>
          <ul aria-label="Selected bags by product" className="mt-4 grid gap-3 sm:grid-cols-3">
            {BUY_PRODUCTS.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#E5EAF0] bg-white px-4 py-3 text-sm"
              >
                <span className="font-semibold text-[#40536A]">{product.name}</span>
                <span className="shrink-0 font-extrabold tabular-nums text-[#17212B]">
                  {qtyOf(product.id)} bags
                </span>
              </li>
            ))}
          </ul>
          <div
            role="progressbar"
            aria-label="Order quantity eligibility"
            aria-valuemin={0}
            aria-valuemax={minimumBags ?? 0}
            aria-valuenow={minimumBags === null ? 0 : Math.min(bags, minimumBags)}
            className="mt-4 h-4 overflow-hidden rounded-full bg-[#E5EAF0]"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                eligible ? "bg-[#16803C]" : selectedMethod ? "bg-[#C90016]" : "bg-[#A0AEC0]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            aria-live="polite"
            className={`mt-4 flex items-start gap-3 text-sm font-semibold sm:text-base ${
              eligible ? "text-[#16803C]" : selectedMethod ? "text-[#C90016]" : "text-[#718096]"
            }`}
          >
            {eligible ? (
              <>
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
                <p>Minimum order met. You can continue.</p>
              </>
            ) : selectedMethod ? (
              <>
                <AlertCircle aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
                <p>
                  {bags === 0
                    ? `Add cement to your cart. ${selectedFulfilment?.title ?? "Your selected method"} requires at least ${minimumBags} bags.`
                    : selectedMethod === "collect"
                      ? `Your collection order must contain at least 40 bags. Add ${remainingBags} more bags to continue.`
                      : `Delivery requires a minimum of 200 bags. Add ${remainingBags} more bags to continue.`}
                </p>
              </>
            ) : (
              <>
                <AlertCircle aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
                <p>Choose Collect or Deliver to check your order quantity.</p>
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="account-heading" className="mb-10">
          <h2 id="account-heading" className="text-xl font-extrabold text-[#17212B] sm:text-2xl">
            Choose an account to place your order
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#718096] sm:text-base">
            Link your existing account or register a new account to continue with your order.
          </p>
          <fieldset className="mt-4">
            <legend className="sr-only">Select an account type</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "existing", title: "Existing Account", Icon: UserRound },
                  { value: "new", title: "New Account", Icon: UserRoundPlus },
                ] as const
              ).map(({ value, title, Icon }) => {
                const isSelected = accountType === value;
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 transition-colors focus-within:ring-2 focus-within:ring-[#E30613]/30 sm:p-6 ${
                      isSelected
                        ? "border-[#E30613] bg-[#FCF6F7]"
                        : "border-[#E5EAF0] bg-white hover:border-[#E30613]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="account-type"
                      value={value}
                      checked={isSelected}
                      onChange={() => {
                        setAccountType(value);
                        setAccountMessage("");
                      }}
                      className="sr-only"
                    />
                    <Icon aria-hidden="true" className="size-8 text-[#E30613]" />
                    <span className="flex-1 text-base font-bold text-[#17212B] sm:text-lg">
                      {title}
                    </span>
                    {isSelected && (
                      <Check aria-label="Selected" className="size-6 text-[#E30613]" />
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {accountType === "existing" && (
            <form
              onSubmit={handleAccountLink}
              noValidate
              className="mt-5 rounded-2xl border border-[#E5EAF0] bg-white p-6 shadow-[0_5px_20px_rgba(23,33,43,0.04)] sm:p-8"
            >
              <h3 className="text-lg font-extrabold text-[#17212B] sm:text-xl">
                Link an existing account
              </h3>
              <p className="mt-2 text-sm text-[#718096] sm:text-base">
                Enter your account credentials to link your account to this cart.
              </p>
              <p className="mt-2 text-xs text-[#718096]">
                Your account is checked securely by the sign-in service. Your password is not saved
                in this browser.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#40536A] sm:text-base">
                  Username
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.currentTarget.value)}
                    className="mt-2 h-12 w-full rounded-lg border border-[#E5EAF0] bg-white px-4 text-base font-normal text-[#17212B] outline-none focus:border-[#E30613] focus:ring-2 focus:ring-[#E30613]/15"
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-[#40536A] sm:text-base">
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    className="mt-2 h-12 w-full rounded-lg border border-[#E5EAF0] bg-white px-4 text-base font-normal text-[#17212B] outline-none focus:border-[#E30613] focus:ring-2 focus:ring-[#E30613]/15"
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-6 inline-flex min-h-14 items-center justify-center rounded-lg bg-[#E30613] px-6 text-base font-bold text-white transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212B]"
              >
                Find and link account
              </button>
              {accountMessage && (
                <p role="alert" className="mt-4 text-sm font-medium text-[#C90016]">
                  {accountMessage}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-[#718096] sm:text-base">
                Account verification is not connected to a server yet. Credentials are not saved or
                verified in this browser.
              </p>
            </form>
          )}

          {accountType === "new" && (
            <div className="mt-5 rounded-2xl border border-[#E5EAF0] bg-white p-6 shadow-[0_5px_20px_rgba(23,33,43,0.04)] sm:p-8">
              <h3 className="text-lg font-extrabold text-[#17212B] sm:text-xl">
                Create a new account
              </h3>
              <p className="mt-2 text-sm text-[#718096] sm:text-base">
                Save your current cart details and continue to new user registration.
              </p>
              <button
                type="button"
                onClick={handleNewAccount}
                className="mt-6 inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-[#E30613] px-6 text-base font-bold text-white transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17212B]"
              >
                Save cart details &amp; register
                <ArrowRight aria-hidden="true" className="size-5" />
              </button>
              {accountMessage && (
                <p role="status" className="mt-4 text-sm font-medium text-[#C90016]">
                  {accountMessage}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-[#718096] sm:text-base">
                Your cart is persisted by the existing cart store. The registration form is
                available, but online submission is not connected yet.
              </p>
            </div>
          )}
        </section>

        <section
          aria-label="Review your order"
          className="border-t border-[#E5EAF0] py-8 text-center sm:py-10"
        >
          <p className="mb-5 text-sm text-[#718096] sm:text-base">
            Your selections are ready for review once all order and account requirements are met.
          </p>
          <button
            type="button"
            onClick={handleProceed}
            className="inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-lg bg-[#E30613] px-8 text-base font-bold text-white shadow-[0_6px_20px_rgba(227,6,19,0.2)] transition-colors hover:bg-[#C90016] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#17212B] sm:w-[360px]"
          >
            Proceed to view order
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
          {proceedMessage && (
            <p
              role="alert"
              className="mx-auto mt-5 flex max-w-xl items-start justify-center gap-3 text-sm font-medium text-[#C90016] sm:text-base"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{proceedMessage}</span>
            </p>
          )}
          {selectedMethod && eligible && !accountType && (
            <p className="mt-4 text-sm text-[#40536A] sm:text-base">
              Select an account option before proceeding to review your order.
            </p>
          )}
          {selectedMethod && eligible && accountType && (
            <p className="mt-4 text-sm text-[#40536A] sm:text-base">
              The order review step requires a linked account or completed registration. Neither
              account verification nor registration is currently configured.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

if (import.meta.vitest) {
  const { afterEach, beforeEach, describe, expect, it } = import.meta.vitest;

  async function mountBuyPage() {
    const [{ act }, { createRoot }, { CartProvider }, { DemoAccountProvider }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("@/features/store/cart"),
      import("@/features/account/DemoAccountProvider"),
    ]);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <DemoAccountProvider>
          <CartProvider>
            <BuyPage />
          </CartProvider>
        </DemoAccountProvider>,
      );
    });
    return { container, root, act };
  }

  async function click(element: Element | null, act: typeof import("react").act) {
    if (!element) throw new Error("Expected interactive element was not rendered");
    await act(async () => {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }

  async function updateInput(
    input: HTMLInputElement | null,
    value: string,
    act: typeof import("react").act,
  ) {
    if (!input) throw new Error("Expected input was not rendered");
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  describe("BuyPage", () => {
    let mounted: Awaited<ReturnType<typeof mountBuyPage>> | undefined;

    beforeEach(() => {
      window.localStorage.clear();
    });

    afterEach(async () => {
      if (mounted) {
        await mounted.act(async () => mounted?.root.unmount());
        mounted.container.remove();
        mounted = undefined;
      }
    });

    it("renders the fulfilment options and all three products in the requested order", async () => {
      mounted = await mountBuyPage();
      const { container } = mounted;

      const productNames = ["SURECEM 32,5N", "SureBuild 42,5N", "SURECAST 42,5R"];
      const productPositions = productNames.map(
        (name) => container.textContent?.indexOf(name) ?? -1,
      );

      expect(container.querySelector("h1")?.textContent).toBe("Load Your Cart");
      expect(container.querySelector('input[value="collect"]')).not.toBeChecked();
      expect(container.querySelector('input[value="delivery"]')).not.toBeChecked();
      expect(container.textContent).toContain(
        "Choose Collect or Deliver to check your order quantity.",
      );
      expect(productPositions.every((position) => position >= 0)).toBe(true);
      expect(productPositions).toEqual([...productPositions].sort((a, b) => a - b));
    });

    it("starts every product at zero when stored cart quantities are not valid 40-bag amounts", async () => {
      window.localStorage.setItem(
        "ppc-zw-cart-v1",
        JSON.stringify({
          items: {
            "surecem-32-5n": 12,
            "surebuild-42-5n": 21,
            "surecast-42-5r": 1,
          },
          method: "delivery",
          methodSelected: true,
        }),
      );
      mounted = await mountBuyPage();
      const { container } = mounted;

      for (const name of ["SURECEM 32,5N", "SureBuild 42,5N", "SURECAST 42,5R"]) {
        expect(container.querySelector(`[aria-label="0 bags of ${name}"]`)).toBeInTheDocument();
      }
      expect(container.textContent).toContain("Total bags selected: 0");
    });

    it("adds quantities in 40-bag increments and updates collect eligibility", async () => {
      mounted = await mountBuyPage();
      const { container, act } = mounted;

      await click(container.querySelector('input[name="fulfilment"][value="collect"]'), act);
      await click(
        container.querySelector('button[aria-label="Add 40 bags of SURECEM 32,5N"]'),
        act,
      );

      expect(
        container.querySelector('[aria-label="40 bags of SURECEM 32,5N"]'),
      ).toBeInTheDocument();
      expect(container.textContent).toContain("Total bags selected: 40");
      expect(container.textContent).toContain("Minimum order met. You can continue.");
      expect(container.querySelector('[role="progressbar"]')).toHaveAttribute(
        "aria-valuenow",
        "40",
      );
    });

    it("increments and decrements each product by exactly 40 bags", async () => {
      mounted = await mountBuyPage();
      const { container, act } = mounted;

      for (const name of ["SURECEM 32,5N", "SureBuild 42,5N", "SURECAST 42,5R"]) {
        await click(container.querySelector(`button[aria-label="Add 40 bags of ${name}"]`), act);
        expect(container.querySelector(`[aria-label="40 bags of ${name}"]`)).toBeInTheDocument();
        await click(container.querySelector(`button[aria-label="Add 40 bags of ${name}"]`), act);
        expect(container.querySelector(`[aria-label="80 bags of ${name}"]`)).toBeInTheDocument();
        await click(container.querySelector(`button[aria-label="Remove 40 bags of ${name}"]`), act);
        expect(container.querySelector(`[aria-label="40 bags of ${name}"]`)).toBeInTheDocument();
      }

      expect(container.textContent).toContain("Total bags selected: 120");
      const productBreakdown = container.querySelector('[aria-label="Selected bags by product"]');
      expect(productBreakdown?.textContent).toContain("SURECEM 32,5N40 bags");
      expect(productBreakdown?.textContent).toContain("SureBuild 42,5N40 bags");
      expect(productBreakdown?.textContent).toContain("SURECAST 42,5R40 bags");
    });

    it("recalculates delivery eligibility without changing quantities", async () => {
      mounted = await mountBuyPage();
      const { container, act } = mounted;

      await click(container.querySelector('input[name="fulfilment"][value="collect"]'), act);
      await click(
        container.querySelector('button[aria-label="Add 40 bags of SURECEM 32,5N"]'),
        act,
      );
      await click(container.querySelector('input[name="fulfilment"][value="delivery"]'), act);

      expect(container.textContent).toContain("Total bags selected: 40");
      expect(container.textContent).toContain(
        "Delivery requires a minimum of 200 bags. Add 160 more bags to continue.",
      );
    });

    it("does not claim account verification when no backend is configured", async () => {
      mounted = await mountBuyPage();
      const { container, act } = mounted;

      await click(container.querySelector('input[name="account-type"][value="existing"]'), act);
      await updateInput(container.querySelector('input[autocomplete="username"]'), "customer", act);
      await updateInput(
        container.querySelector('input[autocomplete="current-password"]'),
        "not-saved",
        act,
      );
      const form = container.querySelector("form");
      if (!form) throw new Error("Existing-account form was not rendered");
      await act(async () =>
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );

      expect(container.textContent).toContain("development demo credentials were not recognised");
      expect(container.querySelector('input[autocomplete="current-password"]')).toHaveValue("");
    });

    it("recognises the development demo credentials without storing the password", async () => {
      window.localStorage.setItem(
        "ppc-zw-cart-v1",
        JSON.stringify({
          items: { "surecem-32-5n": 40 },
          method: "collect",
          methodSelected: true,
        }),
      );
      mounted = await mountBuyPage();
      const { container, act } = mounted;

      await click(container.querySelector('input[name="account-type"][value="existing"]'), act);
      await updateInput(
        container.querySelector('input[autocomplete="username"]'),
        "vespers.makado",
        act,
      );
      await updateInput(
        container.querySelector('input[autocomplete="current-password"]'),
        "vespers.makado",
        act,
      );
      const form = container.querySelector("form");
      if (!form) throw new Error("Existing-account form was not rendered");
      await act(async () =>
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
      );

      expect(container.textContent).toContain(
        "Customer details verified successfully, you can proceed to view order.",
      );
      expect(container.querySelector('input[autocomplete="current-password"]')).toHaveValue("");
    });
  });
}
