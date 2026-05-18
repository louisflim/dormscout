/** Whether a landlord user/DTO is approved for tenant bookings. */
export function isLandlordVerified(userOrMeta) {
  if (!userOrMeta) return false;
  return Boolean(
    userOrMeta.verified
    || userOrMeta.isVerified
    || String(userOrMeta.verificationStatus || '').toLowerCase() === 'approved'
  );
}
