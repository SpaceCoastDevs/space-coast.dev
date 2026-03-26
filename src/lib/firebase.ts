import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebase() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: import.meta.env.FIREBASE_PROJECT_ID,
      clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL,
      // Netlify stores env vars with literal \n; replace them so the key parses correctly
      privateKey: import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

initFirebase();

export const db = getFirestore();

export interface Skill {
  name: string;
  category: string;
  approved: boolean;
  submittedBy?: string;
}

export interface MemberProfile {
  discordId: string;
  discordUsername: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  bluesky: string;
  skills: string[];
  lookingFor: string[];
  isPublic: boolean;
  email: string;
  emailVerified: boolean;
  joinedAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
