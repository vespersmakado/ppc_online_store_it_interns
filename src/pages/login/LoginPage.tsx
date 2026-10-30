import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck, Truck } from "lucide-react";
import { useDemoAccount } from "@/features/account/demo-account";
import logoImage from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const { authenticate } = useDemoAccount();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const usernameValue = String(formData.get("username") ?? "").trim();
    const passwordValue = String(formData.get("password") ?? "");

    if (!usernameValue || !passwordValue) {
      setStatus("Please enter both your username/email and password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await authenticate(usernameValue, passwordValue);
      if (result === "authenticated") {
        await navigate({ to: "/customer" });
        return;
      }
      if (result === "staff-authenticated") {
        await navigate({ to: "/staff" });
        return;
      }
      setStatus(
        result === "disabled"
          ? "Sign-in is temporarily unavailable. Please contact the site administrator."
          : "The username or password is incorrect.",
      );
    } catch (error) {
      console.error("Could not sign in to the PPC demo account.", error);
      setStatus("Sign-in could not be completed. Please check your connection and try again.");
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

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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

              <div className="mt-4 flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-base text-[#40536A]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="size-4 accent-[#E30613]"
                  />
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={isSubmitting}
                className="mt-6 h-12 w-full rounded-[7px] text-lg font-bold normal-case tracking-normal"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-sm leading-5 text-[#718096]">
                Sign in with your customer or Sales Department account.
              </p>

              {status && (
                <p
                  role="status"
                  className="rounded-[7px] border border-[#F2CDD3] bg-[#FFF5F6] p-3 text-base leading-7 text-[#8D1020]"
                >
                  {status}
                </p>
              )}
            </form>

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
        "Remember me",
        "Sign In",
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

    it("supports toggling password visibility and demonstrates front-end-only validation", async () => {
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
        const form = container.querySelector("form");

        if (!password || !visibilityButton || !form) {
          throw new Error("Expected login form controls to render.");
        }

        expect(password.type).toBe("password");
        await act(async () => visibilityButton.click());
        expect(container.querySelector<HTMLInputElement>("#password")?.type).toBe("text");
        expect(container.querySelector('button[aria-label="Hide password"]')).not.toBeNull();

        await act(async () =>
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
        );
        expect(container.textContent).toContain(
          "Please enter both your username/email and password.",
        );
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    });
  });
}
