const SECRET_NAMES = [
  'PRIVY_TEST_APP_ID',
  'PRIVY_TEST_APP_SECRET',
  'PRIVY_TEST_VERIFICATION_KEY',
  'PRIVY_TEST_OTP',
  'PRIVY_TEST_TALENT_EMAIL',
  'PRIVY_TEST_EMPLOYER_EMAIL',
  'PRIVY_TEST_TALENT_DID',
  'PRIVY_TEST_EMPLOYER_DID',
] as const;

type E2eSecretName = (typeof SECRET_NAMES)[number];

export interface E2eAccounts {
  readonly otp: string;
  readonly talentEmail: string;
  readonly employerEmail: string;
  readonly talentDid: string;
  readonly employerDid: string;
}

function readSecret(name: E2eSecretName): string {
  return process.env[name]?.trim() ?? '';
}

export function missingE2eSecrets(): readonly E2eSecretName[] {
  return SECRET_NAMES.filter((name) => readSecret(name).length === 0);
}

/**
 * Names only. Values are not included in the error.
 */
export function requireE2eAccounts(): E2eAccounts {
  const missing = missingE2eSecrets();
  if (missing.length > 0) {
    throw new Error(
      `Privy test secrets are missing: ${missing.join(', ')}. The e2e job does not skip. Add these GitHub Actions secrets for the dedicated Privy test app. See tests/e2e/README.md.`,
    );
  }

  return {
    otp: readSecret('PRIVY_TEST_OTP'),
    talentEmail: readSecret('PRIVY_TEST_TALENT_EMAIL').toLowerCase(),
    employerEmail: readSecret('PRIVY_TEST_EMPLOYER_EMAIL').toLowerCase(),
    talentDid: readSecret('PRIVY_TEST_TALENT_DID'),
    employerDid: readSecret('PRIVY_TEST_EMPLOYER_DID'),
  };
}
