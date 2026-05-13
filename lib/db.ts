// IndexedDB wrapper using Dexie. All user state lives here.
// No backend database. Each user's data is local to their browser.

"use client";

import Dexie, { type Table } from "dexie";
import type { Post, Settings, VoiceProfile } from "./types";

class CoachDB extends Dexie {
  posts!: Table<Post, string>;
  settings!: Table<Settings, "default">;
  voiceProfiles!: Table<VoiceProfile, "default">;

  constructor() {
    super("LinkedInContentCoach");
    this.version(1).stores({
      posts: "id, date, hook",
      settings: "id",
      voiceProfiles: "id",
    });
  }
}

let _db: CoachDB | null = null;

export function getDB(): CoachDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() can only be called in the browser");
  }
  if (!_db) _db = new CoachDB();
  return _db;
}

// Convenience helpers.

export async function getSettings(): Promise<Settings | undefined> {
  return getDB().settings.get("default");
}

export async function saveSettings(s: Omit<Settings, "id">): Promise<void> {
  await getDB().settings.put({ ...s, id: "default" });
}

export async function getVoiceProfile(): Promise<VoiceProfile | undefined> {
  return getDB().voiceProfiles.get("default");
}

export async function saveVoiceProfile(markdown: string): Promise<void> {
  await getDB().voiceProfiles.put({ id: "default", markdown, updatedAt: Date.now() });
}

export async function getAllPosts(): Promise<Post[]> {
  return getDB().posts.orderBy("date").reverse().toArray();
}

export async function addPosts(posts: Post[]): Promise<void> {
  await getDB().posts.bulkPut(posts);
}

export async function clearPosts(): Promise<void> {
  await getDB().posts.clear();
}

export async function exportAll(): Promise<{
  posts: Post[];
  voiceProfile: VoiceProfile | null;
  settings: Settings | null;
}> {
  const [posts, voiceProfile, settings] = await Promise.all([
    getAllPosts(),
    getVoiceProfile(),
    getSettings(),
  ]);
  return {
    posts,
    voiceProfile: voiceProfile ?? null,
    settings: settings ? { ...settings, apiKey: "" } : null, // never export the key
  };
}

export async function importAll(data: {
  posts?: Post[];
  voiceProfile?: VoiceProfile | null;
  settings?: Settings | null;
}): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.posts, db.voiceProfiles, db.settings, async () => {
    if (data.posts) {
      await db.posts.clear();
      await db.posts.bulkAdd(data.posts);
    }
    if (data.voiceProfile) {
      await db.voiceProfiles.put({ ...data.voiceProfile, id: "default" });
    }
    if (data.settings) {
      // Import everything except the API key (security: never replay a key from a file)
      const existing = await db.settings.get("default");
      await db.settings.put({
        ...data.settings,
        id: "default",
        apiKey: existing?.apiKey ?? "",
      });
    }
  });
}
