import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck, Truck } from "lucide-react";
import { useDemoAccount } from "@/features/account/demo-account";
import logoImage from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemoAccount();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoMode = async (role: "customer" | "staff") => {
    setIsSubmitting(true);
    setStatus("");

    try {
      enterDemoMode(role);
      await navigate({ to: role === "staff" ? "/staff" : "/customer" });
    } catch (error) {
      console.error("Could not enter the PPC demo portal.", error);
      setStatus("The demo portal could not be opened. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17212B]">
      <div className="flex h-8 items-center justify-center bg-[#E30613] px-4 text-sm font-semibold tracking-[0.18em] text-white sm:h-8">
        <div className="flex w-full max-w-[520px] items-center gap-3 sm:gap-4">
          <span aria-hidden="true" className="h-px flex-1 bg-white/70" />
          <span className="whitespace-nowrap uppercase">STRENGTH GUARANTEED</span>
          <span aria-hidden="true" className="h-px flex-1 bg-white/70" />
        </div>
      </div>

      <header className="border-b border-[#E5EAF0] bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-6 lg:px-12">
          <Link
            to="/"
            aria-label="PPC Zimbabwe home"
            className="flex h-[120px] w-[120px] shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E30613]"
          >
            <img
              src={logoImage}
              alt="PPC Strength Guaranteed"
              className="h-full w-full object-contain"
            />
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 text-lg font-medium text-[#40536A] md:flex"
          >
            <Link to="/buy" className="transition-colors hover:text-[#E30613]">
              Shop Cement
            </Link>
            <a href="#delivery-info" className="transition-colors hover:text-[#E30613]">
              Delivery Information
            </a>
            <a href="#help" className="transition-colors hover:text-[#E30613]">
              Help
            </a>
            <Link
              to="/login"
              className="font-semibold text-[#17212B] transition-colors hover:text-[#E30613]"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative isolate overflow-hidden px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="pointer-events-none absolute -left-20 bottom-0 -z-10 h-64 w-64 rounded-full bg-[#FCF6F7] blur-3xl" />
        <div className="pointer-events-none absolute -right-12 top-12 -z-10 h-80 w-80 rounded-full bg-[#FCF6F7] blur-3xl" />

        <div className="mx-auto grid w-full max-w-[1100px] items-center gap-8 pt-3 lg:grid-cols-[440px_minmax(0,440px)] lg:justify-center lg:gap-[72px] lg:pt-8">
          <section aria-labelledby="welcome-heading" className="max-w-[440px] text-left">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-lg font-semibold text-[#526276] transition-colors hover:text-[#E30613]"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to store
            </Link>

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#E30613]">
              Your PPC account
            </p>
            <h1
              id="welcome-heading"
              className="mt-3 text-[50px] font-bold leading-[1.15] tracking-[-0.03em] text-[#17212B]"
            >
              Welcome back
            </h1>
            <p className="mt-4 max-w-[390px] text-lg leading-8 text-[#40536A]">
              Sign in to track your orders, manage your delivery details and continue buying genuine
              PPC cement products with confidence.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "View and manage your orders.",
                "Keep your delivery details organised.",
                "Shop genuine PPC cement products.",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex min-h-[36px] items-center gap-3 text-lg text-[#40536A]"
                >
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#FCF0F1] text-[#E30613]">
                    <Check aria-hidden="true" className="size-[12px]" />
                  </span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="login-heading"
            className="w-full max-w-[440px] rounded-[12px] border border-[#E5EAF0] bg-white p-6 shadow-[0_8px_30px_rgba(23,33,43,0.06)] sm:p-8"
          >
            <div className="space-y-2">
              <h2 id="login-heading" className="text-[28px] font-bold leading-[1.3] text-[#17212B]">
                Sign in to your account
              </h2>
              <p className="text-lg leading-7 text-[#718096]">
                Enter your details below to continue.
              </p>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <Label htmlFor="username" className="text-base font-semibold text-[#17212B]">
                  Username or email address
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username or email"
                  className="mt-2 h-12 w-full rounded-[7px] border border-[#D9E1E8] bg-white px-[14px] text-lg text-[#17212B] placeholder:text-[#9AA6B2] focus-visible:border-[#E30613] focus-visible:ring-2 focus-visible:ring-[#E30613]/20"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-base font-semibold text-[#17212B]">
                    Password
                  </Label>
                  <a
                    href="mailto:sales@ppc.co.zw?subject=Password%20assistance"
                    className="text-base font-semibold text-[#E30613] transition-colors hover:text-[#C90016]"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-[7px] border border-[#D9E1E8] bg-white px-[14px] pr-11 text-lg text-[#17212B] placeholder:text-[#9AA6B2] focus-visible:border-[#E30613] focus-visible:ring-2 focus-visible:ring-[#E30613]/20"
                    required
                  />
                  <button
                    type="button"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[7px] text-[#718096] transition-colors hover:text-[#E30613] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E30613]"
                  >
                    {passwordVisible ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm leading-5 text-[#718096]">
                Choose a portal below to continue without a password.
              </p>

              <Button
                type="button"
                variant="hero"
                size="lg"
                disabled={isSubmitting}
                onClick={() => void handleDemoMode("customer")}
                className="mt-2 h-12 w-full rounded-[7px] text-lg font-bold normal-case tracking-normal"
              >
                {isSubmitting ? "Opening portal..." : "Proceed in demo mode"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onClick={() => void handleDemoMode("staff")}
                className="h-12 w-full rounded-[7px] text-lg font-bold normal-case tracking-normal"
              >
                Proceed to Sales Department
              </Button>

              {status && (
                <p
                  role="status"
                  className="rounded-[7px] border border-[#F2CDD3] bg-[#FFF5F6] p-3 text-base leading-7 text-[#8D1020]"
                >
                  {status}
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-[#E5EAF0] pt-5 text-center">
              <p className="text-base text-[#718096]">
                Don&apos;t have an account?{" "}
                <a href="/new-user" className="font-semibold text-[#E30613]">
                  Create an account
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#E5EAF0] bg-white px-5 py-5 text-sm text-[#718096] sm:px-6 lg:px-12">
        © PPC Zimbabwe. All rights reserved.
      </footer>
    </div>
  );
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;

  describe("LoginPage", () => {
    it("renders the PPC sign-in layout and account actions", async () => {
      const [{ renderToStaticMarkup }, { DemoAccountProvider }] = await Promise.all([
        import("react-dom/server"),
        import("@/features/account/DemoAccountProvider"),
      ]);
      const html = renderToStaticMarkup(
        <DemoAccountProvider>
          <LoginPage />
        </DemoAccountProvider>,
      );

      for (const text of [
        "Your PPC account",
        "Welcome back",
        "Sign in to your account",
        "Username or email address",
        "Password",
        "Forgot password?",
        "Proceed in demo mode",
        "Proceed to Sales Department",
        "Create an account",
      ]) {
        expect(html).toContain(text);
      }

      expect(html).toContain('href="/new-user"');
      expect(html).toContain('href="/buy"');
      expect(html).toContain('href="mailto:sales@ppc.co.zw?subject=Password%20assistance"');
      expect(html).toContain('name="username"');
      expect(html).toContain('name="password"');
      expect(html).toContain('type="password"');
      expect(html).toContain('aria-label="Show password"');
    });

    it("supports toggling password visibility and presents password-free demo access", async () => {
      const [{ act }, { createRoot }, { DemoAccountProvider }] = await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("@/features/account/DemoAccountProvider"),
      ]);
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);

      try {
        await act(async () =>
          root.render(
            <DemoAccountProvider>
              <LoginPage />
            </DemoAccountProvider>,
          ),
        );
        const password = container.querySelector<HTMLInputElement>("#password");
        const visibilityButton = container.querySelector<HTMLButtonElement>(
          'button[aria-label="Show password"]',
        );
        if (!password || !visibilityButton) {
          throw new Error("Expected login controls to render.");
        }

        expect(password.type).toBe("password");
        await act(async () => visibilityButton.click());
        expect(container.querySelector<HTMLInputElement>("#password")?.type).toBe("text");
        expect(container.querySelector('button[aria-label="Hide password"]')).not.toBeNull();

        expect(container.textContent).toContain("Proceed in demo mode");
        expect(container.textContent).toContain("Proceed to Sales Department");
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    });
  });
}
