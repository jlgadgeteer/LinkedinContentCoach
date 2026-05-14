// Shared card-state constants used by client components that call server
// actions via React's useActionState. These cannot live inside the
// "use server" action files because Next.js requires every export from a
// "use server" file to be an async function. Splitting them out is the
// canonical fix (see https://nextjs.org/docs/messages/invalid-use-server-value).

export type CardState = { error: string | null; ok: string | null };

export const initialCardState: CardState = { error: null, ok: null };

export type DraftActionState = { error: string | null; ok: string | null };

export const initialDraftActionState: DraftActionState = { error: null, ok: null };

export type KnowledgeCardState = { error: string | null; ok: string | null };

export const initialKnowledgeCardState: KnowledgeCardState = {
  error: null,
  ok: null,
};
