import React, { createContext, useContext, ReactNode } from "react";
import { useAuth0 } from "react-native-auth0";

type Auth0Return = ReturnType<typeof useAuth0>;

interface AuthContextType extends Auth0Return {
  uuid: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth0 = useAuth0();

  // Add uuid to the auth context
  const authContextValue: AuthContextType = {
    ...auth0,
    uuid: "1970b18c-5c61-4cfe-a414-d371e52443c6", // Placeholder UUID
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
