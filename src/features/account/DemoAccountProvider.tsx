import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  DemoAccountContext,
  type DemoAccountProfile,
} from "./demo-account";

const SESSION_KEY = "ppc-demo-account-session-v1";

function demoIdentity(username: string) {
  const normalized = username.trim().toLowerCase();
  if (normalized === "sales@ppc.co.zw") {
    return { username: normalized, role: "staff" as const };
  }
  if (
    normalized === "customer1@gmail.com" ||
    normalized === "vespers.makado" ||
    normalized === "vespers.makado@gmail.com"
  ) {
    return {
      username: normalized === "vespers.makado@gmail.com" ? "vespers.makado" : normalized,
      role: "customer" as const,
    };
  }
  return null;
}

function demoUsernameForRole(role: "customer" | "staff") {
  return role === "staff" ? "sales@ppc.co.zw" : "customer1@gmail.com";
}

function restoreProfile(profile: DemoAccountProfile): DemoAccountProfile {
  try {
    const stored = window.localStorage.getItem(
      `ppc-customer-demo-profile-v1:${profile.fields["demoLogin"] ?? profile.accountNumber ?? profile.emailAddress}`,
    );
    if (!stored) return profile;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return profile;
    const fields = Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    return {
      ...profile,
      companyOrIndividual:
        fields["fullLegalName"] ?? fields["registeredLegalName"] ?? profile.companyOrIndividual,
      emailAddress: fields["workEmailAddress"] ?? fields["emailAddress"] ?? profile.emailAddress,
      phoneNumber:
        fields["primaryPhoneNumber"] ?? fields["companyPhoneNumbers"] ?? profile.phoneNumber,
      faxNumber: fields["faxNumber"] ?? profile.faxNumber,
      fields: { ...profile.fields, ...fields },
    };
  } catch (error) {
    console.error("Could not restore demo customer profile from local storage.", error);
    return profile;
  }
}

export function DemoAccountProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<"customer" | "staff" | null>(null);
  const [accountProfile, setAccountProfile] = useState<DemoAccountProfile | null>(null);

  const setCustomerProfile = useCallback((username: string) => {
    const profile: DemoAccountProfile =
      username === "vespers.makado"
        ? {
            companyOrIndividual: "Vespers Makado",
            accountNumber: "1230004560098",
            faxNumber: "",
            emailAddress: "vespers.makado@gmail.com",
            phoneNumber: "",
            accountType: "individual",
            fields: {
              fullLegalName: "Vespers Makado",
              demoLogin: username,
              workEmailAddress: "vespers.makado@gmail.com",
              primaryPhoneNumber: "",
              nationalIdNumber: "",
              primaryPhysicalAddress: "",
              accountNumber: "1230004560098",
            },
          }
        : {
            companyOrIndividual: "Customer 1 Demo Company",
            accountNumber: "DEMO-CUST-001",
            faxNumber: "",
            emailAddress: "customer1@gmail.com",
            phoneNumber: "",
            accountType: "company",
            fields: {
              demoLogin: username,
              registeredLegalName: "Customer 1 Demo Company",
              accountNumber: "DEMO-CUST-001",
              workEmailAddress: "customer1@gmail.com",
              companyPhoneNumbers: "",
              registeredOfficeAddress: "",
              buyerAttention: "",
              deliveryAddress: "",
              taxClearanceStatus: "Not supplied",
            },
          };
    setAccountProfile(restoreProfile(profile));
  }, []);

  useEffect(() => {
    try {
      const rawSession = window.localStorage.getItem(SESSION_KEY);
      if (rawSession) {
        const parsed: unknown = JSON.parse(rawSession);
        if (parsed && typeof parsed === "object" && "username" in parsed) {
          const identity = demoIdentity(String(parsed.username));
          if (identity) {
            setIsAuthenticated(true);
            setRole(identity.role);
            if (identity.role === "customer") setCustomerProfile(identity.username);
          } else {
            window.localStorage.removeItem(SESSION_KEY);
          }
        } else {
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Could not restore the local demo portal selection.", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCustomerProfile]);

  const enterDemoMode = useCallback((demoRole: "customer" | "staff") => {
    const identity = {
      username: demoUsernameForRole(demoRole),
      role: demoRole,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(identity));
    setIsAuthenticated(true);
    setRole(demoRole);
    if (demoRole === "customer") setCustomerProfile(identity.username);
    else setAccountProfile(null);
    setIsLoading(false);
  }, [setCustomerProfile]);

  const updateProfile = useCallback((profile: DemoAccountProfile) => {
    window.localStorage.setItem(
      `ppc-customer-demo-profile-v1:${profile.fields["demoLogin"] ?? profile.accountNumber ?? profile.emailAddress}`,
      JSON.stringify(profile.fields),
    );
    setAccountProfile(profile);
  }, []);
  const signOut = useCallback(async () => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error("Could not clear the local demo portal selection.", error);
    } finally {
      setIsAuthenticated(false);
      setRole(null);
      setAccountProfile(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <DemoAccountContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        role,
        isCustomerAuthenticated: isAuthenticated && role === "customer",
        isStaffAuthenticated: isAuthenticated && role === "staff",
        accountProfile,
        enterDemoMode,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </DemoAccountContext.Provider>
  );
}
