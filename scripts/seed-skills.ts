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
  { name: 'Web Components', category: 'Frontend' },
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
  // CMS & No-Code
  { name: 'WordPress', category: 'CMS & No-Code' },
  { name: 'Drupal', category: 'CMS & No-Code' },
  { name: 'Joomla', category: 'CMS & No-Code' },
  { name: 'Shopify', category: 'CMS & No-Code' },
  { name: 'Webflow', category: 'CMS & No-Code' },
  { name: 'Ghost', category: 'CMS & No-Code' },
  { name: 'Contentful', category: 'CMS & No-Code' },
  { name: 'Sanity', category: 'CMS & No-Code' },
  { name: 'Strapi', category: 'CMS & No-Code' },
  { name: 'Payload CMS', category: 'CMS & No-Code' },
  { name: 'Directus', category: 'CMS & No-Code' },
  { name: 'WooCommerce', category: 'CMS & No-Code' },
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
  // Design & UX
  { name: 'Figma', category: 'Design & UX' },
  { name: 'Adobe XD', category: 'Design & UX' },
  { name: 'Sketch', category: 'Design & UX' },
  { name: 'Canva', category: 'Design & UX' },
  { name: 'Adobe Illustrator', category: 'Design & UX' },
  { name: 'Adobe Photoshop', category: 'Design & UX' },
  { name: 'Adobe After Effects', category: 'Design & UX' },
  { name: 'Premiere Pro', category: 'Design & UX' },
  { name: 'UI Design', category: 'Design & UX' },
  { name: 'UX Research', category: 'Design & UX' },
  { name: 'Accessibility (a11y)', category: 'Design & UX' },
  { name: 'Design Systems', category: 'Design & UX' },
  { name: 'Prototyping', category: 'Design & UX' },
  { name: 'Typography', category: 'Design & UX' },
  { name: 'Motion Design', category: 'Design & UX' },
  { name: 'Storybook', category: 'Design & UX' },
  // Science & Data
  { name: 'Data Science', category: 'Science & Data' },
  { name: 'Data Analysis', category: 'Science & Data' },
  { name: 'NumPy', category: 'Science & Data' },
  { name: 'Pandas', category: 'Science & Data' },
  { name: 'Jupyter Notebooks', category: 'Science & Data' },
  { name: 'MATLAB', category: 'Science & Data' },
  { name: 'Statistics', category: 'Science & Data' },
  { name: 'Bioinformatics', category: 'Science & Data' },
  { name: 'GIS / Mapping', category: 'Science & Data' },
  { name: 'Signal Processing', category: 'Science & Data' },
  { name: 'Computer Vision', category: 'Science & Data' },
  { name: 'Scientific Computing', category: 'Science & Data' },
  { name: 'Data Visualization', category: 'Science & Data' },
  // IT & Sysadmin
  { name: 'Active Directory', category: 'IT & Sysadmin' },
  { name: 'Windows Server', category: 'IT & Sysadmin' },
  { name: 'VMware', category: 'IT & Sysadmin' },
  { name: 'Hyper-V', category: 'IT & Sysadmin' },
  { name: 'Networking', category: 'IT & Sysadmin' },
  { name: 'DNS', category: 'IT & Sysadmin' },
  { name: 'PowerShell', category: 'IT & Sysadmin' },
  { name: 'ITIL', category: 'IT & Sysadmin' },
  { name: 'Ansible', category: 'IT & Sysadmin' },
  { name: 'Nagios', category: 'IT & Sysadmin' },
  { name: 'Grafana', category: 'IT & Sysadmin' },
  { name: 'Prometheus', category: 'IT & Sysadmin' },
  { name: 'VPN / Firewall', category: 'IT & Sysadmin' },
  { name: 'Virtualisation', category: 'IT & Sysadmin' },
  { name: 'Help Desk', category: 'IT & Sysadmin' },
  { name: 'Microsoft 365', category: 'IT & Sysadmin' },
  // Amateur Radio
  { name: 'HF Radio', category: 'Amateur Radio' },
  { name: 'VHF/UHF', category: 'Amateur Radio' },
  { name: 'FT8', category: 'Amateur Radio' },
  { name: 'APRS', category: 'Amateur Radio' },
  { name: 'SDR (Software Defined Radio)', category: 'Amateur Radio' },
  { name: 'Antenna Design', category: 'Amateur Radio' },
  { name: 'RF Electronics', category: 'Amateur Radio' },
  { name: 'Emergency Comms (EMCOMM)', category: 'Amateur Radio' },
  { name: 'DMR', category: 'Amateur Radio' },
  { name: 'D-STAR', category: 'Amateur Radio' },
  { name: 'Morse Code (CW)', category: 'Amateur Radio' },
  { name: 'Satellite Operations', category: 'Amateur Radio' },
  { name: 'Mesh Networking (AREDN)', category: 'Amateur Radio' },
  { name: 'JS8Call', category: 'Amateur Radio' },
  // Maker & Fabrication
  { name: '3D Printing', category: 'Maker & Fabrication' },
  { name: 'Laser Cutting', category: 'Maker & Fabrication' },
  { name: 'CNC Routing', category: 'Maker & Fabrication' },
  { name: 'Soldering', category: 'Maker & Fabrication' },
  { name: 'PCB Design', category: 'Maker & Fabrication' },
  { name: 'Arduino', category: 'Maker & Fabrication' },
  { name: 'Raspberry Pi', category: 'Maker & Fabrication' },
  { name: 'Electronics', category: 'Maker & Fabrication' },
  { name: 'IoT', category: 'Maker & Fabrication' },
  { name: 'Embedded Systems', category: 'Maker & Fabrication' },
  { name: 'MicroPython', category: 'Maker & Fabrication' },
  { name: 'FPGA', category: 'Maker & Fabrication' },
  { name: 'KiCad', category: 'Maker & Fabrication' },
  { name: 'Fusion 360', category: 'Maker & Fabrication' },
  { name: 'FreeCAD', category: 'Maker & Fabrication' },
  { name: 'Woodworking', category: 'Maker & Fabrication' },
  { name: 'Vinyl Cutting', category: 'Maker & Fabrication' },
  { name: 'Resin Casting', category: 'Maker & Fabrication' },
  // Community & Leadership
  { name: 'Public Speaking', category: 'Community & Leadership' },
  { name: 'Technical Writing', category: 'Community & Leadership' },
  { name: 'Mentoring', category: 'Community & Leadership' },
  { name: 'Event Planning', category: 'Community & Leadership' },
  { name: 'Community Management', category: 'Community & Leadership' },
  { name: 'Team Leadership', category: 'Community & Leadership' },
  { name: 'Blogging', category: 'Community & Leadership' },
  { name: 'Podcasting', category: 'Community & Leadership' },
  { name: 'Open Source', category: 'Community & Leadership' },
  { name: 'Pair Programming', category: 'Community & Leadership' },
  { name: 'Code Review', category: 'Community & Leadership' },
  { name: 'Agile / Scrum', category: 'Community & Leadership' },
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
