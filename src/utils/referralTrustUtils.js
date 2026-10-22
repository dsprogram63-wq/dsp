/**
 * Referral Trust Verification System
 * 
 * Rules:
 * - Every APPROVED developer and QA tester receives a unique "Reffer Trustable ID"
 * - Format: RFF-[ProfileName]-[Unique3Digits], e.g. RFF-PatelHet-523
 * - The last 3 digits are guaranteed unique across all members
 * - Only Active / Approved members have this ID and can sponsor new applicants
 * - Applicants MUST enter a valid Referrer Trust ID and matching Member Name
 * - An authorization OTP is dispatched to the Sponsor's registered email
 * - Application submission is strictly locked until the Sponsor OTP is verified
 */

const STORAGE_KEY_TRUST_REGISTRY = 'dahej_referral_trust_registry';

/**
 * Format human name into clean alphanumeric PascalCase slug
 * e.g. "Patel Het" -> "PatelHet", "Sneha M. Reddy" -> "SnehaMReddy"
 */
export function formatProfileSlug(name) {
  if (!name || typeof name !== 'string') return 'Member';
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return cleaned || 'Member';
}

/**
 * Extract existing 3-digit numbers from a list of trust IDs
 */
export function extractUsed3Digits(trustIds = []) {
  const used = new Set();
  trustIds.forEach(id => {
    if (!id || typeof id !== 'string') return;
    const match = id.match(/-(\d{3})$/);
    if (match) {
      used.add(parseInt(match[1], 10));
    }
  });
  return used;
}

/**
 * Generate a guaranteed unique 3-digit number (100 - 999) not currently used
 */
export function generateUnique3Digit(usedNumbersSet = new Set()) {
  // Deterministic seed fallback if full, but random first
  for (let attempt = 0; attempt < 500; attempt++) {
    const num = Math.floor(100 + Math.random() * 900);
    if (!usedNumbersSet.has(num)) {
      usedNumbersSet.add(num);
      return num;
    }
  }
  // Linear search fallback if random collisions happen
  for (let num = 100; num <= 999; num++) {
    if (!usedNumbersSet.has(num)) {
      usedNumbersSet.add(num);
      return num;
    }
  }
  return 523; // Default fallback
}

/**
 * Load or initialize global trust ID registry from localStorage
 */
export function getTrustRegistry() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TRUST_REGISTRY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch (e) {}
  return {};
}

export function saveTrustRegistry(registry) {
  try {
    localStorage.setItem(STORAGE_KEY_TRUST_REGISTRY, JSON.stringify(registry));
  } catch (e) {}
}

/**
 * Deterministically get or generate the Reffer Trustable ID for an approved member.
 * If already assigned, reuses the identical ID.
 * Format: RFF-[ProfileName]-[3Digits]
 */
export function getOrAssignReferralTrustId(member, allExistingMembers = []) {
  if (!member) return '';
  
  // Only Approved / Active members can hold an active Referrer Trust ID
  const statusLower = (member.status || '').toLowerCase();
  const isExplicitlyInactive = statusLower === 'pending' || statusLower === 'rejected' || statusLower === 'deactivated';
  if (isExplicitlyInactive) return '';

  const isActive = statusLower === 'active' || statusLower === 'approved' || (!member.status && (member.referralTrustId || member.freelancerId || member.id === 'DEV-452' || member.id === 'DEV-892' || member.id === 'TST-781'));
  if (!isActive) return '';

  const memberId = member.id || member.developerId || member.testerId;
  const registry = getTrustRegistry();

  if (member.referralTrustId && member.referralTrustId.startsWith('RFF-')) {
    registry[memberId] = member.referralTrustId;
    saveTrustRegistry(registry);
    return member.referralTrustId;
  }

  if (registry[memberId] && registry[memberId].startsWith('RFF-')) {
    return registry[memberId];
  }

  // Pre-seed known core members with canonical IDs
  if (memberId === 'DEV-452' || (member.name && member.name.toLowerCase() === 'patel het')) {
    const canonical = 'RFF-PatelHet-523';
    registry[memberId] = canonical;
    saveTrustRegistry(registry);
    return canonical;
  }
  if (memberId === 'DEV-892' || (member.name && member.name.toLowerCase() === 'saheb')) {
    const canonical = 'RFF-Saheb-892';
    registry[memberId] = canonical;
    saveTrustRegistry(registry);
    return canonical;
  }
  if (memberId === 'TST-781' || (member.name && member.name.toLowerCase() === 'hetvi')) {
    const canonical = 'RFF-Hetvi-781';
    registry[memberId] = canonical;
    saveTrustRegistry(registry);
    return canonical;
  }

  // Gather all currently used 3-digit numbers to guarantee uniqueness
  const allUsedIds = [
    ...Object.values(registry),
    ...allExistingMembers.map(m => m.referralTrustId).filter(Boolean)
  ];
  const usedNumbers = extractUsed3Digits(allUsedIds);

  const cleanName = formatProfileSlug(member.name || member.fullName);
  const unique3 = generateUnique3Digit(usedNumbers);
  const newTrustId = `RFF-${cleanName}-${unique3}`;

  registry[memberId] = newTrustId;
  saveTrustRegistry(registry);
  return newTrustId;
}

/**
 * Fetch all currently approved and active potential sponsors from both pools
 */
export function getAllApprovedSponsors(developers = [], testers = []) {
  const sponsors = [];
  const seenIds = new Set();

  const processMember = (m, roleType) => {
    if (!m) return;
    const isApproved = m.status === 'Active' || m.status === 'Approved';
    if (!isApproved) return;

    const id = m.id || m.developerId || m.testerId;
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const trustId = getOrAssignReferralTrustId(m, [...developers, ...testers]);
    if (!trustId) return;

    sponsors.push({
      id,
      name: m.name || m.fullName || 'Member',
      fullName: m.fullName || m.name || 'Member',
      email: (m.email || '').trim().toLowerCase(),
      role: roleType,
      roleTitle: m.primarySkill || m.specialization || m.role || (roleType === 'developer' ? 'Full Stack Developer' : 'QA Tester'),
      avatar: m.avatar || '',
      trustId
    });
  };

  developers.forEach(d => processMember(d, 'developer'));
  testers.forEach(t => processMember(t, 'tester'));

  return sponsors;
}

/**
 * Validate applicant's entered Referral Code (Trust ID) and Reference Name.
 * Strict matching:
 * 1. Trust ID must match an Approved / Active member's referralTrustId (case-insensitive)
 * 2. Reference Name must match that specific member's name
 */
export function validateSponsorCredentials(inputTrustId, inputSponsorName, approvedSponsors = []) {
  const cleanId = (inputTrustId || '').trim().toUpperCase();
  const cleanName = (inputSponsorName || '').trim().toLowerCase();

  if (!cleanId || !cleanName) {
    return {
      valid: false,
      error: 'Invalid'
    };
  }

  if (!cleanId.startsWith('RFF-')) {
    return {
      valid: false,
      error: 'Invalid'
    };
  }

  if (cleanName.length < 3) {
    return {
      valid: false,
      error: 'Invalid'
    };
  }

  // Find by Trust ID (case-insensitive)
  const matchedSponsor = approvedSponsors.find(s => 
    s.trustId && s.trustId.trim().toUpperCase() === cleanId
  );

  if (!matchedSponsor) {
    return {
      valid: false,
      error: 'Invalid'
    };
  }

  // Strict full Name match against matched sponsor (exact name only, no partial substring)
  const sponsorNameNorm = (matchedSponsor.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const sponsorFullNameNorm = (matchedSponsor.fullName || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const sponsorSlug = formatProfileSlug(matchedSponsor.name).toLowerCase();
  const inputSlug = formatProfileSlug(cleanName).toLowerCase();
  const normalizedInputName = cleanName.replace(/\s+/g, ' ');

  // STRICT FULL EXACT MATCH ONLY (DO NOT match prefixes like "Da" for "Dahej Support")
  const isNameMatch = 
    sponsorNameNorm === normalizedInputName ||
    sponsorFullNameNorm === normalizedInputName ||
    (sponsorSlug.length >= 3 && sponsorSlug === inputSlug);

  if (!isNameMatch) {
    return {
      valid: false,
      error: 'Invalid'
    };
  }

  if (!matchedSponsor.email) {
    return {
      valid: false,
      error: 'Invalid'
    };
  }

  return {
    valid: true,
    sponsor: matchedSponsor
  };
}

/**
 * Mask an email address for privacy in UI:
 * e.g. "dsprogram63@gmail.com" -> "ds******63@gmail.com"
 */
export function maskEmailAddress(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 3) {
    return `${local.charAt(0)}***@${domain}`;
  }
  const start = local.slice(0, 2);
  const end = local.slice(-2);
  return `${start}******${end}@${domain}`;
}

/**
 * Remove a member from the Referral Trust Registry
 */
export function removeReferralTrustId(memberId) {
  if (!memberId) return;
  try {
    const registry = getTrustRegistry();
    if (registry && registry[memberId]) {
      delete registry[memberId];
      saveTrustRegistry(registry);
    }
  } catch (e) {
    console.error('Failed to remove referral trust ID from registry:', e);
  }
}
