/**
 * Seed the Firestore `skills` collection with an initial set of tech skills.
 *
 * Usage:
 *   cp .env.example .env   # fill in your Firebase credentials
 *   npx tsx scripts/seed-skills.ts
 *
 * Safe to re-run: uses the skill name as the document ID, so duplicates are skipped
 * (it will just overwrite with identical data).
 */

import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

const skills: Array<{ name: string; category: string }> = [
  // Languages
  { name: 'JavaScript', category: 'Languages' },
  { name: 'TypeScript', category: 'Languages' },
  { name: 'Python', category: 'Languages' },
  { name: 'Go', category: 'Languages' },
  { name: 'Rust', category: 'Languages' },
  { name: 'Java', category: 'Languages' },
  { name: 'C#', category: 'Languages' },
  { name: 'PHP', category: 'Languages' },
  { name: 'Ruby', category: 'Languages' },
  { name: 'Swift', category: 'Languages' },
  { name: 'Kotlin', category: 'Languages' },
  { name: 'C++', category: 'Languages' },
  { name: 'Dart', category: 'Languages' },
  { name: 'Elixir', category: 'Languages' },
  { name: 'Scala', category: 'Languages' },
  { name: 'R', category: 'Languages' },
  { name: 'Lua', category: 'Languages' },
  // Frontend
  { name: 'React', category: 'Frontend' },
  { name: 'Vue', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'Astro', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Remix', category: 'Frontend' },
  { name: 'Nuxt', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'HTMX', category: 'Frontend' },
  { name: 'Alpine.js', category: 'Frontend' },
  { name: 'SolidJS', category: 'Frontend' },
  // Backend
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Flask', category: 'Backend' },
  { name: 'Rails', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: '.NET', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Laravel', category: 'Backend' },
  { name: 'Hono', category: 'Backend' },
  { name: 'Actix', category: 'Backend' },
  { name: 'Gin', category: 'Backend' },
  // Mobile
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter', category: 'Mobile' },
  { name: 'Expo', category: 'Mobile' },
  { name: 'iOS (UIKit)', category: 'Mobile' },
  { name: 'iOS (SwiftUI)', category: 'Mobile' },
  { name: 'Android (Jetpack)', category: 'Mobile' },
  // Database
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MySQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Redis', category: 'Database' },
  { name: 'SQLite', category: 'Database' },
  { name: 'Firestore', category: 'Database' },
  { name: 'DynamoDB', category: 'Database' },
  { name: 'Supabase', category: 'Database' },
  { name: 'Prisma', category: 'Database' },
  { name: 'Drizzle', category: 'Database' },
  { name: 'Elasticsearch', category: 'Database' },
  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud & DevOps' },
  { name: 'GCP', category: 'Cloud & DevOps' },
  { name: 'Azure', category: 'Cloud & DevOps' },
  { name: 'Docker', category: 'Cloud & DevOps' },
  { name: 'Kubernetes', category: 'Cloud & DevOps' },
  { name: 'Terraform', category: 'Cloud & DevOps' },
  { name: 'GitHub Actions', category: 'Cloud & DevOps' },
  { name: 'Netlify', category: 'Cloud & DevOps' },
  { name: 'Vercel', category: 'Cloud & DevOps' },
  { name: 'Fly.io', category: 'Cloud & DevOps' },
  { name: 'Linux', category: 'Cloud & DevOps' },
  // AI / ML
  { name: 'Machine Learning', category: 'AI / ML' },
  { name: 'TensorFlow', category: 'AI / ML' },
  { name: 'PyTorch', category: 'AI / ML' },
  { name: 'LangChain', category: 'AI / ML' },
  { name: 'OpenAI API', category: 'AI / ML' },
  { name: 'Hugging Face', category: 'AI / ML' },
  { name: 'Ollama', category: 'AI / ML' },
  // Testing
  { name: 'Jest', category: 'Testing' },
  { name: 'Vitest', category: 'Testing' },
  { name: 'Playwright', category: 'Testing' },
  { name: 'Cypress', category: 'Testing' },
  { name: 'pytest', category: 'Testing' },
  { name: 'Testing Library', category: 'Testing' },
  // Cyber Security
  { name: 'Penetration Testing', category: 'Cyber Security' },
  { name: 'Network Security', category: 'Cyber Security' },
  { name: 'OWASP', category: 'Cyber Security' },
  { name: 'Burp Suite', category: 'Cyber Security' },
  { name: 'Metasploit', category: 'Cyber Security' },
  { name: 'Wireshark', category: 'Cyber Security' },
  { name: 'CTF', category: 'Cyber Security' },
  { name: 'Cryptography', category: 'Cyber Security' },
  { name: 'Malware Analysis', category: 'Cyber Security' },
  { name: 'SIEM', category: 'Cyber Security' },
  { name: 'Threat Modeling', category: 'Cyber Security' },
  { name: 'Zero Trust', category: 'Cyber Security' },
  { name: 'IAM', category: 'Cyber Security' },
  { name: 'SOC Operations', category: 'Cyber Security' },
  { name: 'Security Auditing', category: 'Cyber Security' },
  // Gaming
  { name: 'Unity', category: 'Gaming' },
  { name: 'Unreal Engine', category: 'Gaming' },
  { name: 'Godot', category: 'Gaming' },
  { name: 'Game Design', category: 'Gaming' },
  { name: 'WebGL', category: 'Gaming' },
  { name: 'WebGPU', category: 'Gaming' },
  { name: 'OpenGL', category: 'Gaming' },
  { name: 'Vulkan', category: 'Gaming' },
  { name: 'DirectX', category: 'Gaming' },
  { name: 'Shader Programming', category: 'Gaming' },
  { name: 'Level Design', category: 'Gaming' },
  { name: 'Multiplayer Networking', category: 'Gaming' },
  { name: 'Blender', category: 'Gaming' },
];

async function seed() {
  const batch = db.batch();
  let count = 0;

  for (const skill of skills) {
    // Use a URL-safe slug as the document ID so re-runs are idempotent
    const id = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ref = db.collection('skills').doc(id);
    batch.set(
      ref,
      {
        name: skill.name,
        category: skill.category,
        approved: true,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true } // won't overwrite if already exists
    );
    count++;
  }

  await batch.commit();
  console.log(`✓ Seeded ${count} skills into Firestore.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
