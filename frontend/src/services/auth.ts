import { UserProfile, UserRole, JWTSession, UserPermissions } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  INVESTIGATOR: {
    canCalibrateODE: true,
    canEditStochasticParams: true,
    canUploadDHSData: true,
    canRunMultiYearSimulation: true,
    canExportReports: true,
    canViewRawTelemetry: true,
    canAccessValidationSuite: true,
  },
  HEALTH_OFFICER: {
    canCalibrateODE: false,
    canEditStochasticParams: true,
    canUploadDHSData: true,
    canRunMultiYearSimulation: true,
    canExportReports: true,
    canViewRawTelemetry: true,
    canAccessValidationSuite: true,
  },
  POLICY_MAKER: {
    canCalibrateODE: false,
    canEditStochasticParams: false,
    canUploadDHSData: false,
    canRunMultiYearSimulation: true,
    canExportReports: true,
    canViewRawTelemetry: false,
    canAccessValidationSuite: false,
  },
};

export const PRECONFIGURED_USERS: Record<UserRole, { profile: UserProfile; passwordHashBcrypt: string }> = {
  INVESTIGATOR: {
    profile: {
      id: 'usr-inv-001',
      name: 'Dr. Kwame Mensah',
      email: 'investigator@who.int',
      role: 'INVESTIGATOR',
      roleTitle: 'Principal Investigator / Systems Epidemiologist',
      organization: 'WHO Africa Regional Office & Countdown 2030',
      country: 'All SSA',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      permissions: ROLE_PERMISSIONS.INVESTIGATOR,
    },
    // $2a$12$e8x... simulated bcrypt hash
    passwordHashBcrypt: '$2a$12$K1V4oO1gG2u9QxQ.pWw5Je6jTjZ0wz9kK1qQ3eE7rR8tT9yY0uU1i',
  },
  HEALTH_OFFICER: {
    profile: {
      id: 'usr-dho-002',
      name: 'Dr. Amina Mohamed',
      email: 'health.officer@dhis2.org',
      role: 'HEALTH_OFFICER',
      roleTitle: 'District Health Medical Officer / DHIS2 Focal Point',
      organization: 'Ministry of Health & Public Sanitation',
      country: 'Kenya',
      districtAffiliation: 'ke-garissa',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      permissions: ROLE_PERMISSIONS.HEALTH_OFFICER,
    },
    passwordHashBcrypt: '$2a$12$L2W5pP2hH3v0RyR.qXx6Kf7kUkA1x0lL2rR4fF8sS9uU0zZ1vV2j',
  },
  POLICY_MAKER: {
    profile: {
      id: 'usr-pol-003',
      name: 'Hon. Joseph Ndayishimiye',
      email: 'policymaker@unicef.org',
      role: 'POLICY_MAKER',
      roleTitle: 'Director of Maternal & Child Health Policy / Decision Maker',
      organization: 'UNICEF East & Southern Africa & Ministry of Finance',
      country: 'All SSA',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      permissions: ROLE_PERMISSIONS.POLICY_MAKER,
    },
    passwordHashBcrypt: '$2a$12$M3X6qQ3iI4w1SzS.rYy7Lg8lVlB2y1mM3sS5gG9tT0vV1aA2wW3k',
  },
};

export class AuthService {
  private static STORAGE_KEY = 'maternal_twin_jwt_session';

  /**
   * Generates a signed JWT session structure
   */
  public static createJWTSession(profile: UserProfile): JWTSession {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 86400; // 24 hours validity

    const header = {
      alg: 'HS256' as const,
      typ: 'JWT' as const,
    };

    const payload = {
      sub: profile.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      org: profile.organization,
      iat: now,
      exp: exp,
    };

    const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '');
    const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    
    // Pseudo HMAC signature computation
    const rawSig = `${base64Header}.${base64Payload}.secret_maternal_twin_2026_key`;
    const signature = btoa(rawSig).substring(0, 43).replace(/[\/=]/g, '_');

    const token = `${base64Header}.${base64Payload}.${signature}`;

    return {
      token,
      header,
      payload,
      signature,
      isAuthenticated: true,
    };
  }

  /**
   * Loads current active session or returns default Investigator
   */
  public static getSession(): { profile: UserProfile; session: JWTSession } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.session && parsed.profile) {
          // Check expiration
          if (parsed.session.payload.exp > Math.floor(Date.now() / 1000)) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback
    }

    // Default to Investigator
    const defaultProfile = PRECONFIGURED_USERS.INVESTIGATOR.profile;
    const defaultSession = this.createJWTSession(defaultProfile);
    const data = { profile: defaultProfile, session: defaultSession };
    this.saveSession(data.profile, data.session);
    return data;
  }

  public static getCurrentProfile(): UserProfile {
    return this.getSession().profile;
  }

  public static getCurrentSession(): JWTSession {
    return this.getSession().session;
  }

  public static saveSession(profile: UserProfile, session: JWTSession): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ profile, session }));
    } catch {
      // ignore
    }
  }

  public static switchRole(role: UserRole): { profile: UserProfile; session: JWTSession } {
    const userDef = PRECONFIGURED_USERS[role];
    const profile: UserProfile = {
      ...userDef.profile,
      permissions: ROLE_PERMISSIONS[role],
    };
    const session = this.createJWTSession(profile);
    const data = { profile, session };
    this.saveSession(data.profile, data.session);
    return data;
  }

  public static logout(): { profile: UserProfile; session: JWTSession } {
    // Return Policy Maker (Viewer) with clean session
    return this.switchRole('POLICY_MAKER');
  }
}
