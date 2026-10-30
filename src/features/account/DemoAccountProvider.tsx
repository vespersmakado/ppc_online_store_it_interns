import { useCallback, useState, type ReactNode } from "react";
import {
  DemoAccountContext,
  type DemoAccountProfile,
  type DemoAccountResult,
} from "./demo-account";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<"customer" | "staff" | null>(null);
  const [accountProfile, setAccountProfile] = useState<DemoAccountProfile | null>(null);

  const authenticate = useCallback((username: string, password: string): DemoAccountResult => {
    if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_AUTH === "false") {
      setIsAuthenticated(false);
      setRole(null);
      setAccountProfile(null);
      return "disabled";
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedUsername === "sales@ppc.co.zw" && password === "sales") {
      setIsAuthenticated(true);
      setRole("staff");
      setAccountProfile(null);
      return "staff-authenticated";
    }
    if (!(
      (normalizedUsername === "vespers.makado" && password === "vespers.makado") ||
      (normalizedUsername === "customer1@gmail.com" && password === "customer1")
    )) {
      setIsAuthenticated(false);
      setRole(null);
      setAccountProfile(null);
      return "invalid";
    }

    setIsAuthenticated(true);
    setRole("customer");
    const profile: DemoAccountProfile =
      normalizedUsername === "vespers.makado"
        ? {
            companyOrIndividual: "Vespers Makado",
            accountNumber: "1230004560098",
            faxNumber: "",
            emailAddress: "vespers.makado@gmail.com",
            phoneNumber: "",
            accountType: "individual",
            fields: {
              fullLegalName: "Vespers Makado",
              demoLogin: normalizedUsername,
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
              demoLogin: normalizedUsername,
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
    return "authenticated";
  }, []);

  const updateProfile = useCallback((profile: DemoAccountProfile) => {
    window.localStorage.setItem(
      `ppc-customer-demo-profile-v1:${profile.fields["demoLogin"] ?? profile.accountNumber ?? profile.emailAddress}`,
      JSON.stringify(profile.fields),
    );
    setAccountProfile(profile);
  }, []);
  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setRole(null);
    setAccountProfile(null);
  }, []);

  return (
    <DemoAccountContext.Provider
      value={{
        isAuthenticated,
        role,
        isCustomerAuthenticated: isAuthenticated && role === "customer",
        isStaffAuthenticated: isAuthenticated && role === "staff",
        accountProfile,
        authenticate,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </DemoAccountContext.Provider>
  );
}
