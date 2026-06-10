// Mock for jose (ESM-only dependency from @coinbase/cdp-sdk)
// Used in test environment where CJS module loader can't handle ESM

export function importPKCS8() {
  return Promise.resolve('mock-private-key');
}

export function importSPKI() {
  return Promise.resolve('mock-public-key');
}

export function SignJWT() {
  return {
    setProtectedHeader: function () { return this; },
    setIssuedAt: function () { return this; },
    setExpirationTime: function () { return this; },
    setIssuer: function () { return this; },
    setAudience: function () { return this; },
    sign: function () { return Promise.resolve('mock-jwt-token'); },
  };
}

export function jwtVerify() {
  return Promise.resolve({ payload: {}, protectedHeader: {} });
}
