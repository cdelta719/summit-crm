import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../store/AuthContext';
import { PROFILES, type ProfileConfig } from '../../types';

type Screen = 'select' | 'pin' | 'register';

export default function LoginPage() {
  const { loginWithPin, registerWithPin, isProfileRegistered } = useAuth();
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedProfile, setSelectedProfile] = useState<ProfileConfig | null>(null);
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resetPin = useCallback(() => {
    setPin(['', '', '', '']);
    setError('');
  }, []);

  const handleProfileClick = (profile: ProfileConfig) => {
    setSelectedProfile(profile);
    resetPin();
    const registered = isProfileRegistered(profile.id);
    setScreen(registered ? 'pin' : 'register');
  };

  const handleBack = () => {
    setScreen('select');
    setSelectedProfile(null);
    resetPin();
  };

  useEffect(() => {
    if ((screen === 'pin' || screen === 'register') && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [screen]);

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    setError('');

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3 && newPin.every(d => d !== '')) {
      submitPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newPin = pasted.split('');
      setPin(newPin);
      inputRefs.current[3]?.focus();
      submitPin(pasted);
    }
  };

  const submitPin = async (pinStr: string) => {
    if (!selectedProfile || loading) return;
    setLoading(true);

    if (screen === 'register') {
      const err = await registerWithPin(selectedProfile.id, pinStr);
      if (err) {
        setError(err);
        resetPin();
      }
    } else {
      const err = await loginWithPin(selectedProfile.id, pinStr);
      if (err === 'not_registered') {
        setScreen('register');
        resetPin();
      } else if (err) {
        setError(err);
        resetPin();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-scaleIn">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <span className="text-6xl">🏔️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Summit CRM</h1>
          <p className="text-sm text-gray-400 mt-1">Summit Digital Co</p>
        </div>

        {screen === 'select' && (
          <div className="animate-fadeIn">
            <p className="text-center text-sm text-gray-500 mb-6">Select your profile to continue</p>
            <div className="flex justify-center">
              {PROFILES.map(profile => {
                const registered = isProfileRegistered(profile.id);
                return (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileClick(profile)}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: profile.color }}
                    >
                      {profile.initials}
                    </div>
                    <span className="text-base font-semibold text-gray-900">{profile.name}</span>
                    {registered ? (
                      <span className="text-xs text-green-600 font-medium">✅</span>
                    ) : (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Set up</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(screen === 'pin' || screen === 'register') && selectedProfile && (
          <div className="animate-fadeIn">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl max-w-sm mx-auto">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-900 text-sm mb-6 transition-colors"
              >
                ← Back
              </button>

              <div className="flex flex-col items-center mb-8">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3"
                  style={{ backgroundColor: selectedProfile.color }}
                >
                  {selectedProfile.initials}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{selectedProfile.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {screen === 'register' ? 'Set your 4-digit PIN' : 'Enter your PIN'}
                </p>
              </div>

              {/* PIN Input */}
              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
                      ${error
                        ? 'border-red-400 bg-red-50 text-red-600 animate-shake'
                        : digit
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20'
                      }`}
                  />
                ))}
              </div>

              {error && (
                <div className="text-center mb-4">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {loading && (
                <div className="text-center">
                  <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-[#1E3A5F] rounded-full animate-spin" />
                </div>
              )}

              <p className="text-center text-[10px] text-gray-400 mt-4">
                {screen === 'register'
                  ? 'Choose a memorable 4-digit PIN'
                  : 'Numbers only · 4 digits'}
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-8">
          Local-only authentication · Data stored in your browser
        </p>
      </div>
    </div>
  );
}
