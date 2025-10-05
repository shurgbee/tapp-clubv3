import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAuth0 } from "react-native-auth0";

console.log(
  "[DEBUG AUTH] ========== AuthContext.tsx MODULE LOADING =========="
);

type Auth0Return = ReturnType<typeof useAuth0>;

interface AuthContextType extends Auth0Return {
  uuid: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
console.log("[DEBUG AUTH] AuthContext created");

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("[DEBUG AUTH] ========== AuthProvider RENDER START ==========");

  console.log("[DEBUG AUTH] Calling useAuth0 hook...");
  const auth0 = useAuth0();
  console.log(
    "[DEBUG AUTH] useAuth0 returned - user:",
    !!auth0.user,
    "error:",
    !!auth0.error,
    "isLoading:",
    auth0.isLoading
  );

  const [uuid, setUuid] = useState<string | null>(null);
  const [isFetchingUuid, setIsFetchingUuid] = useState(false);

  // Fetch user_id from backend when we have a user.sub
  useEffect(() => {
    const fetchUserId = async () => {
      if (auth0.user?.sub && !uuid && !isFetchingUuid) {
        console.log(
          "[DEBUG AUTH] Fetching user_id from backend for sub:",
          auth0.user.sub
        );
        setIsFetchingUuid(true);

        try {
          const encodedSub = encodeURIComponent(auth0.user.sub);
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/users/by-sub/${encodedSub}`
          );

          if (response.ok) {
            const data = await response.json();
            console.log("[DEBUG AUTH] ✅ Fetched user_id:", data.user_id);
            setUuid(data.user_id);
          } else {
            console.log(
              "[DEBUG AUTH] ❌ Failed to fetch user_id, status:",
              response.status
            );
          }
        } catch (error) {
          console.log("[DEBUG AUTH] ❌ Error fetching user_id:", error);
        } finally {
          setIsFetchingUuid(false);
        }
      }
    };

    fetchUserId();
  }, [auth0.user?.sub, uuid, isFetchingUuid]);

  // Add uuid to the auth context
  const authContextValue: AuthContextType = {
    ...auth0,
    uuid: uuid,
  };

  console.log(
    "[DEBUG AUTH] AuthContext value created with uuid:",
    authContextValue.uuid
  );
  console.log("[DEBUG AUTH] Rendering AuthContext.Provider with children");

  const result = (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );

  console.log(
    "[DEBUG AUTH] ========== AuthProvider RENDER COMPLETE =========="
  );
  return result;
}

export function useAuth() {
  console.log("[DEBUG AUTH] useAuth hook called");
  const context = useContext(AuthContext);

  if (context === undefined) {
    console.log("[DEBUG AUTH] ERROR: useAuth called outside AuthProvider!");
    throw new Error("useAuth must be used within an AuthProvider");
  }

  console.log(
    "[DEBUG AUTH] useAuth returning context - user:",
    !!context.user,
    "error:",
    !!context.error,
    "isLoading:",
    context.isLoading,
    "uuid:",
    context.uuid
  );
  return context;
}

console.log("[DEBUG AUTH] ========== AuthContext.tsx MODULE LOADED ==========");
