import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { switchRoleApi, checkHealth } from "../api/client";

export interface UserRoleProfile {
  role_id: string;
  name: string;
  badge: string;
  jurisdiction: string;
  clearance_level: string;
  permissions: string[];
}

export const PRESET_ROLES: Record<string, UserRoleProfile> = {
  DFO: {
    role_id: "DFO",
    name: "Divisional Forest Officer (DFO)",
    badge: "DFO-ATR-01",
    jurisdiction: "Anamalai Tiger Reserve & Nilgiri Biosphere",
    clearance_level: "LEVEL-4 (TOP SECRET)",
    permissions: ["all", "interdiction_dispatch", "change_detection", "risk_override", "permit_audit"],
  },
  POLICE_CMD: {
    role_id: "POLICE_CMD",
    name: "Police Tactical Interdiction Commander",
    badge: "TN-POL-TACTICAL-88",
    jurisdiction: "State Highway Patrol & Checkpost Network",
    clearance_level: "LEVEL-3 (TACTICAL DISPATCH)",
    permissions: ["interdiction_dispatch", "roadblock_authorise", "vehicle_tracking", "alerts_view"],
  },
  RANGE_GUARD: {
    role_id: "RANGE_GUARD",
    name: "Forest Range Field Officer",
    badge: "RNG-NAVAMALAI-14",
    jurisdiction: "Navamalai Core Sector Checkpost",
    clearance_level: "LEVEL-2 (FIELD OPERATIONS)",
    permissions: ["vehicle_inspection", "permit_verify", "incident_log", "alerts_view"],
  },
  GIS_ANALYST: {
    role_id: "GIS_ANALYST",
    name: "GIS & Satellite Intelligence Specialist",
    badge: "GIS-ISRO-SENTINEL-07",
    jurisdiction: "Copernicus Sentinel-2 Processing Center",
    clearance_level: "LEVEL-3 (REMOTE SENSING)",
    permissions: ["change_detection", "ndvi_analysis", "density_mapping", "alerts_view"],
  },
};

// Matches the backend's default PUSHPA_DEMO_PASSWORD (see backend/.env.example).
// If you change that env var on the backend, update this to match, or the
// role switcher below will get a 401 for every elevated role.
const DEMO_PASSWORD = (import.meta as any).env?.VITE_DEMO_PASSWORD || "pushpa-demo";

interface AuthContextType {
  currentUser: UserRoleProfile;
  authToken: string | null;
  backendOnline: boolean;
  backendChecking: boolean;
  backendDetails: { mode?: string; storage?: any } | null;
  switchRole: (roleId: string) => Promise<void>;
  checkConnection: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserRoleProfile>(() => {
    const saved = localStorage.getItem("pushpa_active_role");
    return saved && PRESET_ROLES[saved] ? PRESET_ROLES[saved] : PRESET_ROLES.DFO;
  });
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("pushpa_auth_token"));
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [backendChecking, setBackendChecking] = useState<boolean>(true);
  const [backendDetails, setBackendDetails] = useState<{ mode?: string; storage?: any } | null>(null);

  const checkConnection = async () => {
    setBackendChecking(true);
    try {
      const res = await checkHealth();
      if (res.ok) {
        setBackendOnline(true);
        setBackendDetails(res.data);
      } else {
        setBackendOnline(false);
        setBackendDetails(null);
      }
    } catch {
      setBackendOnline(false);
      setBackendDetails(null);
    } finally {
      setBackendChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const switchRole = async (roleId: string) => {
    const profile = PRESET_ROLES[roleId] || PRESET_ROLES.DFO;
    setCurrentUser(profile);
    localStorage.setItem("pushpa_active_role", roleId);

    try {
      const res = await switchRoleApi(roleId, DEMO_PASSWORD);
      if (res.ok && res.data.access_token) {
        setAuthToken(res.data.access_token);
        localStorage.setItem("pushpa_auth_token", res.data.access_token);
      }
      // A non-ok result (e.g. wrong demo password after it's been changed
      // in backend/.env) just means we stay on the locally-selected profile
      // without a verified token -- the UI still switches roles for demo
      // purposes, it just won't carry real backend authorization.
    } catch {
      // Fallback in local/offline demo mode
    }
  };

  const hasPermission = (perm: string) => {
    if (currentUser.permissions.includes("all")) return true;
    return currentUser.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authToken,
        backendOnline,
        backendChecking,
        backendDetails,
        switchRole,
        checkConnection,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
