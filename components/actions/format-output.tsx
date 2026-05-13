import * as React from "react";
import { PostBlock } from "@/components/output/post-block";

const POST_RE = /<post>([\s\S]*?)<\/post>/g;

/**
 * Splits a model response into <post> blocks and surrounding prose. Used by
 * the Draft and Ideate views to render the editorial moment differently
 * from the rest. During streaming the regex may not match yet; the caller
 * decides whether to render this or raw text.
 */
export function FormattedOutput({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let postCount = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(POST_RE.source, POST_RE.flags);

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(
        <ProseSlice key={`p-${match.index}`} text={text.slice(lastIdx, match.index)} />,
      );
    }
    postCount += 1;
    const inner = match[1] ?? "";
    const words = inner.trim().split(/\s+/).filter(Boolean).length;
    parts.push(
      <PostBlock key={`post-${match.index}`} meta={`Draft · ${words} words`}>
        {inner
          .trim()
          .split(/\n{2,}/)
          .map((para, i) => (
            <p key={i}>{para}</p>
          ))}
      </PostBlock>,
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(<ProseSlice key={`p-tail`} text={text.slice(lastIdx)} />);
  }

  if (postCount === 0 && parts.length === 0) return null;
  return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{parts}</div>;
}

function ProseSlice({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return <div style={{ whiteSpace: "pre-wrap" }}>{trimmed}</div>;
}
