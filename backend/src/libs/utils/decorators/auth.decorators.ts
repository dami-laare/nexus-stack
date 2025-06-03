import { SetMetadata } from '@nestjs/common';

export const SKIP_AUTH_GUARD_KEY = 'SKIP_AUTH_GUARD';
export const DISALLOW_BACKDOOR = 'DISALLOW_BACKDOOR';
export const SKIP_ONBOARDING_STEP_VERIFICATION_KEY =
  'SKIP_ONBOARDING_STEP_VERIFICATION';

export const ALLOW_ONBOARDING_WITHOUT_TOKEN_KEY =
  'ALLOW_ONBOARDING_WITHOUT_TOKEN';
export const REQUIRE_2FA_KEY = 'REQUIRE_2FA';
export const TIER_REQUIRED = 'TIER_REQUIRED';
export const LOOSE_AUTH = 'LOOSE_AUTH';
export const REQUIRE_TRANSACTION_KEY = 'REQUIRE_TRANSACTION_KEY';
export const REQUIRE_KYC_COMPLETE_KEY = 'REQUIRE_KYC_COMPLETE';
export const REQUIRE_BASE_KYC_KEY = 'REQUIRE_BASE_KYC';
export const ONBOARDING_STAGE_DECORATOR_KEY = 'ONBOARDING_STAGE';
export const REQUIRE_ACTIVE_ACCOUNT = 'REQUIRE_ACTIVE_ACCOUNT';

export const SkipAuthGuard = () => SetMetadata(SKIP_AUTH_GUARD_KEY, true);
export const DisallowBackdoor = () => SetMetadata(SKIP_AUTH_GUARD_KEY, true);
export const LooseAuth = () => SetMetadata(LOOSE_AUTH, true);
export const SkipOnboardingStepVerification = () =>
  SetMetadata(SKIP_ONBOARDING_STEP_VERIFICATION_KEY, true);

export const RequireTwoFa = () => SetMetadata(REQUIRE_2FA_KEY, true);

// export const AdminPermissions = (...permissions: string[]) => {
//   return applyDecorators(
//     SetMetadata('permissions', permissions),
//     UseGuards(AdminGuard),
//   );
// };

export const CheckAccountRestriction = () =>
  SetMetadata(REQUIRE_ACTIVE_ACCOUNT, true);
