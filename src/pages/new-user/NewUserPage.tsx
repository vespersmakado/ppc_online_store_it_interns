import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import logoImage from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AccountType = "company" | "individual";

const inputClassName =
  "mt-2 h-16 rounded-lg border-[#D8DEE6] bg-white px-3.5 text-base text-[#17212B] placeholder:text-[#8A96A5] focus-visible:border-[#E30613] focus-visible:ring-[#E30613]/20";

const labelClassName = "text-sm font-semibold text-[#263648]";

const companyFields = [
  {
    id: "registered-legal-name",
    name: "registeredLegalName",
    label: "Registered Legal Name",
    placeholder: "Enter the registered legal name",
    autoComplete: "organization",
    wide: true,
  },
  {
    id: "trading-name",
    name: "tradingName",
    label: "Trading Name",
    placeholder: "Enter the trading name",
  },
  {
    id: "company-registration-number",
    name: "companyRegistrationNumber",
    label: "Company Registration Number",
    placeholder: "Enter the company registration number",
  },
  {
    id: "tax-identification-number",
    name: "taxIdentificationNumber",
    label: "Tax Identification Number (TIN / BP Number)",
    placeholder: "Enter the TIN / BP number",
  },
  {
    id: "vat-registration-number",
    name: "vatRegistrationNumber",
    label: "VAT / Sales Tax Registration Number",
    placeholder: "Enter the VAT / sales tax registration number",
  },
  {
    id: "incorporation-details",
    name: "incorporationDetails",
    label: "Date & Place of Incorporation",
    placeholder: "Enter date, city, and country",
  },
  {
    id: "registered-office-address",
    name: "registeredOfficeAddress",
    label: "Registered Physical Office Address",
    placeholder: "Enter the registered office address",
    multiline: true,
    wide: true,
  },
  {
    id: "company-phone-numbers",
    name: "companyPhoneNumbers",
    label: "Phone Numbers",
    placeholder: "Enter one or more phone numbers",
    type: "tel",
  },
  {
    id: "industry-sector",
    name: "industrySector",
    label: "Industry / Sector",
    placeholder: "Enter your industry or sector",
  },
  {
    id: "accreditations-licenses",
    name: "accreditationsLicenses",
    label: "Accreditations & Licenses",
    placeholder: "List applicable accreditations and licenses",
    multiline: true,
    wide: true,
  },
] as const;

const individualFields = [
  {
    id: "full-legal-name",
    name: "fullLegalName",
    label: "Full Legal Name",
    placeholder: "Enter your full legal name",
    autoComplete: "name",
    wide: true,
  },
  {
    id: "date-of-birth",
    name: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
  },
  {
    id: "place-country-of-birth",
    name: "placeCountryOfBirth",
    label: "Place / Country of Birth",
    placeholder: "Enter the place and country of birth",
  },
  {
    id: "gender-identity",
    name: "genderIdentity",
    label: "Gender Identity",
    placeholder: "Enter your gender identity",
  },
  {
    id: "nationality-citizenship",
    name: "nationalityCitizenship",
    label: "Nationality / Citizenship",
    placeholder: "Enter your nationality or citizenship",
  },
  {
    id: "national-id-number",
    name: "nationalIdNumber",
    label: "National ID / Identity Card Number",
    placeholder: "Enter your national ID number",
  },
  {
    id: "passport-details",
    name: "passportDetails",
    label: "Passport Details",
    placeholder: "Enter passport number, issuing country, and expiry",
    wide: true,
  },
  {
    id: "personal-tax-reference",
    name: "personalTaxReference",
    label: "Tax Reference / Personal TIN",
    placeholder: "Enter your personal tax reference or TIN",
  },
  {
    id: "social-security-number",
    name: "socialSecurityNumber",
    label: "Social Security / National Pension Number",
    placeholder: "Enter your social security or pension number",
  },
  {
    id: "primary-physical-address",
    name: "primaryPhysicalAddress",
    label: "Primary Physical Address",
    placeholder: "Enter your primary physical address",
    multiline: true,
    wide: true,
  },
  {
    id: "work-email-address",
    name: "workEmailAddress",
    label: "Work Email Address",
    type: "email",
    autoComplete: "work email",
    placeholder: "name@company.co.zw",
  },
  {
    id: "primary-phone-number",
    name: "primaryPhoneNumber",
    label: "Primary Phone / Mobile Number",
    type: "tel",
    autoComplete: "tel",
    placeholder: "Enter your phone or mobile number",
  },
] as const;

export function NewUserPage() {
  const [message, setMessage] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("company");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const confirmUsername = String(formData.get("confirmUsername") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (username.trim() !== confirmUsername.trim()) {
      setMessage("The usernames do not match. Please check both username fields.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("The passwords do not match. Please check both password fields.");
      return;
    }

    setMessage(
      "Your details are complete, but online registration submission is not available yet. Please contact sales@ppc.co.zw for assistance.",
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17212B]">
      <div className="h-2 bg-[#E30613]" />
      <header className="border-b border-[#E5EAF0] bg-white">
        <div className="mx-auto flex min-h-[82px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="PPC Zimbabwe home"
            className="flex size-[68px] shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
          >
            <img
              src={logoImage}
              alt="PPC Strength Guaranteed"
              className="h-full w-full object-contain"
            />
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-5 text-sm font-semibold sm:gap-8 sm:text-base"
          >
            <Link to="/" className="text-[#40536A] transition-colors hover:text-[#E30613]">
              Home
            </Link>
            <Link to="/buy" className="text-[#40536A] transition-colors hover:text-[#E30613]">
              Buy Cement
            </Link>
            <Link to="/login" className="text-[#40536A] transition-colors hover:text-[#E30613]">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#526276] transition-colors hover:text-[#E30613]"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to store
          </Link>

          <section
            aria-labelledby="registration-heading"
            className="overflow-hidden rounded-xl border border-[#E5EAF0] bg-white shadow-[0_8px_28px_-18px_rgba(23,33,43,0.3)]"
          >
            <div className="border-b border-[#E5EAF0] px-5 py-7 text-center sm:px-8 sm:py-8">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-[#FCF0F1] text-[#E30613]">
                <Building2 aria-hidden="true" className="size-6" />
              </div>
              <p className="text-base font-extrabold uppercase tracking-[0.2em] text-[#E30613]">
                PPC Zimbabwe Online Store
              </p>
              <h1
                id="registration-heading"
                className="mt-2 text-3xl font-black tracking-tight text-[#17212B] sm:text-4xl"
              >
                Create your PPC account
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#617084]">
                Choose an account type, then provide the details required for your PPC customer
                account. All displayed fields are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-7 sm:px-8 sm:py-8">
              <fieldset className="mb-8">
                <legend className="mb-4 text-lg font-extrabold text-[#17212B]">
                  Select account type
                </legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      { value: "company", label: "Company / Organisation" },
                      { value: "individual", label: "Individual" },
                    ] as const
                  ).map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-lg border-2 px-5 py-4 text-base font-semibold transition-colors focus-within:ring-2 focus-within:ring-[#E30613]/20 ${
                        accountType === value
                          ? "border-[#E30613] bg-[#FCF0F1] text-[#8D1020]"
                          : "border-[#D8DEE6] bg-white text-[#263648] hover:border-[#E30613]/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={value}
                        checked={accountType === value}
                        onChange={() => setAccountType(value)}
                        className="size-5 accent-[#E30613]"
                        required
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <legend className="mb-5 text-lg font-extrabold text-[#17212B]">
                  {accountType === "company"
                    ? "Company / organisation details"
                    : "Individual details"}
                </legend>
                {(accountType === "company" ? companyFields : individualFields).map((field) => (
                  <div
                    key={field.id}
                    className={"wide" in field && field.wide ? "sm:col-span-2" : undefined}
                  >
                    <Label htmlFor={field.id} className={labelClassName}>
                      {field.label}
                    </Label>
                    {"multiline" in field && field.multiline ? (
                      <Textarea
                        id={field.id}
                        name={field.name}
                        placeholder={"placeholder" in field ? field.placeholder : undefined}
                        className="mt-2 min-h-32 resize-y rounded-lg border-[#D8DEE6] bg-white px-3.5 py-3 text-base text-[#17212B] placeholder:text-[#8A96A5] focus-visible:border-[#E30613] focus-visible:ring-[#E30613]/20"
                        required
                      />
                    ) : (
                      <Input
                        id={field.id}
                        name={field.name}
                        type={"type" in field ? field.type : "text"}
                        autoComplete={"autoComplete" in field ? field.autoComplete : undefined}
                        placeholder={"placeholder" in field ? field.placeholder : undefined}
                        className={inputClassName}
                        required
                      />
                    )}
                  </div>
                ))}
              </fieldset>

              <div className="my-8 border-t border-[#E5EAF0]" />

              <fieldset className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <legend className="mb-5 text-lg font-extrabold text-[#17212B]">
                  Account and delivery details
                </legend>

                <div>
                  <Label htmlFor="account-number" className={labelClassName}>
                    Account number
                  </Label>
                  <Input
                    id="account-number"
                    name="accountNumber"
                    autoComplete="off"
                    placeholder="Enter your account number"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fax-number" className={labelClassName}>
                    Fax number
                  </Label>
                  <Input
                    id="fax-number"
                    name="faxNumber"
                    type="tel"
                    autoComplete="off"
                    placeholder="Enter your fax number"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email-address" className={labelClassName}>
                    Email address
                  </Label>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.co.zw"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="buyer-attention" className={labelClassName}>
                    Attention (buyer)
                  </Label>
                  <Input
                    id="buyer-attention"
                    name="buyerAttention"
                    autoComplete="name"
                    placeholder="Buyer or contact person's name"
                    className={inputClassName}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="delivery-address" className={labelClassName}>
                    Goods delivery address
                  </Label>
                  <Textarea
                    id="delivery-address"
                    name="deliveryAddress"
                    autoComplete="shipping street-address"
                    placeholder="Where should your goods be delivered?"
                    className="mt-2 min-h-32 resize-y rounded-lg border-[#D8DEE6] bg-white px-3.5 py-3 text-base text-[#17212B] placeholder:text-[#8A96A5] focus-visible:border-[#E30613] focus-visible:ring-[#E30613]/20"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="tax-clearance" className={labelClassName}>
                    Tax clearance status
                  </Label>
                  <select
                    id="tax-clearance"
                    name="taxClearanceStatus"
                    defaultValue=""
                    className="mt-2 flex h-16 w-full rounded-lg border border-[#D8DEE6] bg-white px-3.5 text-base text-[#17212B] outline-none transition-colors focus-visible:border-[#E30613] focus-visible:ring-2 focus-visible:ring-[#E30613]/20"
                    required
                  >
                    <option value="" disabled>
                      Select your tax clearance status
                    </option>
                    <option value="valid">Valid tax clearance certificate</option>
                    <option value="pending">Certificate pending</option>
                    <option value="not-available">No valid certificate</option>
                  </select>
                </div>
              </fieldset>

              <div className="my-8 border-t border-[#E5EAF0]" />

              <fieldset className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <legend className="mb-5 text-lg font-extrabold text-[#17212B]">
                  Create your login
                </legend>

                <div>
                  <Label htmlFor="username" className={labelClassName}>
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="Choose a username"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-username" className={labelClassName}>
                    Confirm username
                  </Label>
                  <Input
                    id="confirm-username"
                    name="confirmUsername"
                    autoComplete="off"
                    placeholder="Enter your username again"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className={labelClassName}>
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password" className={labelClassName}>
                    Confirm password
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    className={inputClassName}
                    required
                  />
                </div>
              </fieldset>

              <div className="mt-8 border-t border-[#E5EAF0] pt-6 text-center">
                <p className="text-sm leading-6 text-[#718096]">
                  By submitting, you confirm that the information provided is accurate and may be
                  used by PPC Zimbabwe to review your account request.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="h-16 w-full justify-between rounded-lg px-5 text-base font-bold normal-case tracking-normal sm:w-auto sm:min-w-[280px]"
                  >
                    Submit registration
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                </div>
                {message && (
                  <p
                    role="status"
                    className="mt-4 rounded-lg bg-[#FCF0F1] p-4 text-sm leading-6 text-[#8D1020]"
                  >
                    {message}
                  </p>
                )}
                <nav
                  aria-label="Continue from registration"
                  className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold"
                >
                  <Link
                    to="/buy"
                    className="text-[#40536A] transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
                  >
                    Proceed to buy cement
                  </Link>
                  <Link
                    to="/login"
                    className="text-[#40536A] transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
                  >
                    Log in
                  </Link>
                </nav>
              </div>
            </form>
          </section>
        </div>
      </main>

      <footer className="mt-8 bg-[#C90016] px-4 py-5 text-sm text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">PPC Zimbabwe Online Store</span>
          <a
            href="mailto:sales@ppc.co.zw"
            className="transition-colors hover:text-[#F7A1A6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            sales@ppc.co.zw
          </a>
        </div>
      </footer>
    </div>
  );
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe("NewUserPage", () => {
    it("renders all required business registration fields", async () => {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const html = renderToStaticMarkup(<NewUserPage />);

      for (const field of [
        "Registered Legal Name",
        "Trading Name",
        "Company Registration Number",
        "Tax Identification Number (TIN / BP Number)",
        "VAT / Sales Tax Registration Number",
        "Date &amp; Place of Incorporation",
        "Registered Physical Office Address",
        "Phone Numbers",
        "Industry / Sector",
        "Accreditations &amp; Licenses",
        "Account number",
        "Fax number",
        "Email address",
        "Attention (buyer)",
        "Goods delivery address",
        "Tax clearance status",
      ]) {
        expect(html).toContain(field);
      }

      expect(html).toContain("Company / Organisation");
      expect(html).toContain('name="accountType"');
      expect(html.match(/<(?:input|textarea|select)\b[^>]*\srequired(?:=|>)/g)).toHaveLength(22);
      expect(html).toContain("Confirm username");
      expect(html).toContain("Confirm password");
      expect(html).toContain('name="password"');
      expect(html).toContain('type="password"');
      expect(html).toContain('type="email"');
      expect(html).toContain('href="mailto:sales@ppc.co.zw"');
      expect(html).toContain("Submit registration");
      expect(html).toContain('aria-label="Continue from registration"');
      expect(html).toContain('href="/buy"');
      expect(html).toContain("Proceed to buy cement");
      expect(html).toContain('href="/login"');
      expect(html).toContain(">Log in</a>");
    });

    it("shows individual details when the individual account type is selected", async () => {
      const [{ act }, { createRoot }] = await Promise.all([
        import("react"),
        import("react-dom/client"),
      ]);
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);

      try {
        await act(async () => root.render(<NewUserPage />));
        const individualOption = container.querySelector<HTMLInputElement>(
          'input[name="accountType"][value="individual"]',
        );
        expect(individualOption).not.toBeNull();

        await act(async () => individualOption?.click());

        for (const field of [
          "Full Legal Name",
          "Date of Birth",
          "Place / Country of Birth",
          "Gender Identity",
          "Nationality / Citizenship",
          "National ID / Identity Card Number",
          "Passport Details",
          "Tax Reference / Personal TIN",
          "Social Security / National Pension Number",
          "Primary Physical Address",
          "Work Email Address",
          "Primary Phone / Mobile Number",
        ]) {
          expect(container.textContent).toContain(field);
        }

        expect(container.textContent).not.toContain("Registered Legal Name");
        expect(container.querySelector("#account-number")).not.toBeNull();
        expect(container.querySelector("#delivery-address")).not.toBeNull();
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    });

    it("requires matching usernames and passwords before submission", async () => {
      const [{ act }, { createRoot }] = await Promise.all([
        import("react"),
        import("react-dom/client"),
      ]);
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);

      try {
        await act(async () => root.render(<NewUserPage />));
        const form = container.querySelector("form");
        const username = container.querySelector<HTMLInputElement>("#username");
        const confirmUsername = container.querySelector<HTMLInputElement>("#confirm-username");
        const password = container.querySelector<HTMLInputElement>("#password");
        const confirmPassword = container.querySelector<HTMLInputElement>("#confirm-password");

        if (!form || !username || !confirmUsername || !password || !confirmPassword) {
          throw new Error("Expected the account credential fields to render.");
        }

        username.value = "customer";
        confirmUsername.value = "other";
        password.value = "secret";
        confirmPassword.value = "secret";
        await act(async () =>
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
        );
        expect(container.textContent).toContain("The usernames do not match.");

        confirmUsername.value = "customer";
        confirmPassword.value = "different";
        await act(async () =>
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
        );
        expect(container.textContent).toContain("The passwords do not match.");
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    });
  });
}
