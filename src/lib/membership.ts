import type { CompanyMember } from '@/types/domain';

/**
 * Check if a user is a member of a specific company
 */
export function isCompanyMember(
  companyId: string,
  userId: string | undefined,
  members: CompanyMember[],
): boolean {
  if (!userId) {
    return false;
  }

  return members.some(
    (member) => member.companyId === companyId && member.userId === userId,
  );
}

/**
 * Get list of company IDs that a user is a member of
 */
export function getUserCompanyIds(
  userId: string | undefined,
  members: CompanyMember[],
): string[] {
  if (!userId) {
    return [];
  }

  return members
    .filter((member) => member.userId === userId)
    .map((member) => member.companyId);
}
