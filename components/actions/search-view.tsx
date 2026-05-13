"use client";

import { useState } from "react";
import { ActionShell } from "@/components/actions/action-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchView() {
  const [query, setQuery] = useState<string>("");

  return (
    <ActionShell
      kind="search"
      eyebrow="Action · Search"
      title="Search past posts"
      primaryLabel="Search"
      primaryStreamingLabel="Searching"
      canSubmit={query.trim().length > 0}
      buildPayload={() => (query.trim() ? { query: query.trim() } : null)}
    >
      <div>
        <Label htmlFor="query">Query</Label>
        <Input
          id="query"
          size="lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Senior hiring, 2024"
        />
      </div>
    </ActionShell>
  );
}
