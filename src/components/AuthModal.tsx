import React, { useState } from 'react';
import { UserProfile, UserRole, JWTSession } from '../types';
import { AuthService, PRECONFIGURED_USERS } from '../services/auth';
import { Shield, Key, UserCheck, CheckCircle2, Lock, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  currentSession: JWTSession;
  onUpdateSession: (profile: UserProfile, session: JWTSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  currentSession,
  onUpdateSession,
}) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentProfile.role);
  const [activeSubTab, setActiveSubTab] = useState<'switch_role' | 'jwt_inspector'>('switch_role');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyRole = (role: UserRole) => {
    setSelectedRole(role);
    const { profile, session } = AuthService.switchRole(role);
    onUpdateSession(profile, session);
  };

  const handleCopyJWT = () => {
    navigator.clipboard.writeText(currentSession.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#0c0e12]'} ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} border rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/50'}`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>
                {t.authTitle}
              </h3>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} font-mono`}>
                {t.authSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:bg-slate-800 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} hover:text-white transition cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className={`flex border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} ${theme === 'light' ? 'bg-slate-50' : 'bg-[#080a0f]'} px-4 font-mono text-xs`}>
          <button
            onClick={() => setActiveSubTab('switch_role')}
            className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'switch_role'
                ? `border-sky-400 ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`
                : `border-transparent ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} hover:text-slate-200`
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.authProfiles}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('jwt_inspector')}
            className={`py-2.5 px-4 font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'jwt_inspector'
                ? `border-sky-400 ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`
                : `border-transparent ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} hover:text-slate-200`
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{t.authJwtInspector}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
          
          {activeSubTab === 'switch_role' && (
            <div className="space-y-4">
              <p className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} text-[11px]`}>
                {t.authSelectProfile}
              </p>

              {/* 3 Role Cards */}
              <div className="space-y-3">
                {(['INVESTIGATOR', 'HEALTH_OFFICER', 'POLICY_MAKER'] as UserRole[]).map((role) => {
                  const userDef = PRECONFIGURED_USERS[role];
                  const isCurrent = currentProfile.role === role;

                  return (
                    <div
                      key={role}
                      onClick={() => handleApplyRole(role)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between ${
                        isCurrent
                          ? 'bg-sky-950/30 border-sky-500 shadow-md shadow-sky-500/10'
                          : `bg-slate-900/40 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} hover:border-slate-700`
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${
                            isCurrent ? 'border-sky-400 bg-sky-500' : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} text-xs`}>{userDef.profile.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                role === 'INVESTIGATOR'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : role === 'HEALTH_OFFICER'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {role}
                            </span>
                          </div>

                          <div className={`text-[11px] ${theme === 'light' ? 'text-sky-600' : 'text-sky-300'} font-bold mt-0.5`}>
                            {userDef.profile.roleTitle}
                          </div>
                          <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                            {userDef.profile.organization} • {userDef.profile.email}
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className={`px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-300'} border border-emerald-500/30 font-bold flex items-center gap-1`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {t.authActive}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Role Permissions Matrix */}
              <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-[#080a0f]'} ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} border rounded-lg p-3 space-y-2`}>
                <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase font-bold block`}>
                  {t.authPermissionsMatrix}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className={currentProfile.permissions.canCalibrateODE ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-slate-600'}>
                      {currentProfile.permissions.canCalibrateODE ? '✓' : '✗'}
                    </span>
                    <span className={currentProfile.permissions.canCalibrateODE ? 'text-slate-200' : 'text-slate-500 line-through'}>
                      {t.authPerm1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={currentProfile.permissions.canEditStochasticParams ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-slate-600'}>
                      {currentProfile.permissions.canEditStochasticParams ? '✓' : '✗'}
                    </span>
                    <span className={currentProfile.permissions.canEditStochasticParams ? 'text-slate-200' : 'text-slate-500 line-through'}>
                      {t.authPerm2}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={currentProfile.permissions.canUploadDHSData ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-slate-600'}>
                      {currentProfile.permissions.canUploadDHSData ? '✓' : '✗'}
                    </span>
                    <span className={currentProfile.permissions.canUploadDHSData ? 'text-slate-200' : 'text-slate-500 line-through'}>
                      {t.authPerm3}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={currentProfile.permissions.canExportReports ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-slate-600'}>
                      {currentProfile.permissions.canExportReports ? '✓' : '✗'}
                    </span>
                    <span className={currentProfile.permissions.canExportReports ? 'text-slate-200' : 'text-slate-500'}>
                      {t.authPerm4}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'jwt_inspector' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} text-[11px]`}>
                  {t.authHmacLabel}
                </span>
                <button
                  onClick={handleCopyJWT}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 cursor-pointer"
                >
                  {copiedToken ? t.authCopied : t.authCopyToken}
                </button>
              </div>

              {/* JWT Raw String */}
              <div className={`p-3 ${theme === 'light' ? 'bg-slate-50' : 'bg-[#080a0f]'} rounded-lg ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} border text-[10px] break-all leading-relaxed font-mono`}>
                <span className={`${theme === 'light' ? 'text-rose-600' : 'text-rose-400'} font-bold`}>{currentSession.token.split('.')[0]}</span>
                <span className="text-slate-600 font-bold">.</span>
                <span className="text-purple-400 font-bold">{currentSession.token.split('.')[1]}</span>
                <span className="text-slate-600 font-bold">.</span>
                <span className="text-cyan-400 font-bold">{currentSession.token.split('.')[2]}</span>
              </div>

              {/* Decoded Header & Payload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-[#080a0f]'} p-2.5 rounded ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} border space-y-1`}>
                  <span className={`text-[10px] ${theme === 'light' ? 'text-rose-600' : 'text-rose-400'} font-bold uppercase block`}>{t.authHeaderLabel}</span>
                  <pre className="text-[10px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(currentSession.header, null, 2)}
                  </pre>
                </div>

                <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-[#080a0f]'} p-2.5 rounded ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} border space-y-1`}>
                  <span className={`text-[10px] ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'} font-bold uppercase block`}>{t.authPayloadLabel}</span>
                  <pre className="text-[10px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(currentSession.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/50'} flex items-center justify-end`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition cursor-pointer"
          >
            {t.authClose}
          </button>
        </div>

      </div>
    </div>
  );
};
