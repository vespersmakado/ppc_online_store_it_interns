import { createContext, useContext } from "react";

export type DemoAccountResult = "authenticated" | "staff-authenticated" | "invalid" | "disabled";
export type DemoAccountRole = "customer" | "staff" | null;

export type DemoAccountProfile = {
  companyOrIndividual: string;
  accountNumber: string;
  faxNumber: string;
  emailAddress: string;
  phoneNumber: string;
  accountType: "company" | "individual";
  fields: Record<string, string>;
};

export type DemoAccountContextValue = {
  isAuthenticated: boolean;
  role: DemoAccountRole;
  isCustomerAuthenticated: boolean;
  isStaffAuthenticated: boolean;
  accountProfile: DemoAccountProfile | null;
  authenticate: (username: string, password: string) => DemoAccountResult;
  updateProfile: (profile: DemoAccountProfile) => void;
  signOut: () => void;
};

export const DemoAccountContext = createContext<DemoAccountContextValue | null>(null);

export function useDemoAccount() {
  const context = useContext(DemoAccountContext);
  if (!context) throw new Error("useDemoAccount must be used inside DemoAccountProvider");
  return context;
}
