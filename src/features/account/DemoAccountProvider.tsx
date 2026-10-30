import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  DemoAccountContext,
  type DemoAccountProfile,
  type DemoAccountResult,
} from "./demo-account";
import {
  authenticateDemoAccount,
  getDemoAccountSession,
  logoutDemoAccount,
} from "./demo-auth.functions";

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
  const authRequestVersion = useRef(0);

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
    let active = true;
    const requestVersion = authRequestVersion.current;
    void getDemoAccountSession()
      .then((session) => {
        if (!active || requestVersion !== authRequestVersion.current) return;
        if (session.role) {
          setIsAuthenticated(true);
          setRole(session.role);
          if (session.role === "customer") setCustomerProfile(session.username);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not restore the demo account session.", error);
      })
      .finally(() => {
        if (active && requestVersion === authRequestVersion.current) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setCustomerProfile]);

  const authenticate = useCallback(
    async (username: string, password: string): Promise<DemoAccountResult> => {
      const requestVersion = ++authRequestVersion.current;
      const response = await authenticateDemoAccount({ data: { username, password } });
      if (requestVersion !== authRequestVersion.current) return "invalid";
      if (response.result === "disabled") {
        setIsAuthenticated(false);
        setRole(null);
        setAccountProfile(null);
        setIsLoading(false);
        return "disabled";
      }
      if (response.result === "invalid") {
        setIsAuthenticated(false);
        setRole(null);
        setAccountProfile(null);
        setIsLoading(false);
        return "invalid";
      }
      if (!response.role) {
        setIsAuthenticated(false);
        setRole(null);
        setAccountProfile(null);
        setIsLoading(false);
        return "invalid";
      }

      setIsAuthenticated(true);
      setRole(response.role);
      if (response.role === "customer") setCustomerProfile(response.username);
      else setAccountProfile(null);
      setIsLoading(false);
      return response.result;
    },
    [setCustomerProfile],
  );

  const updateProfile = useCallback((profile: DemoAccountProfile) => {
    window.localStorage.setItem(
      `ppc-customer-demo-profile-v1:${profile.fields["demoLogin"] ?? profile.accountNumber ?? profile.emailAddress}`,
      JSON.stringify(profile.fields),
    );
    setAccountProfile(profile);
  }, []);
  const signOut = useCallback(async () => {
    ++authRequestVersion.current;
    try {
      await logoutDemoAccount();
    } catch (error) {
      console.error("Could not end the demo account session on the server.", error);
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
        authenticate,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </DemoAccountContext.Provider>
  );
}
