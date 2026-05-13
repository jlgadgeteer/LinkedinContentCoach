import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardTitle, CardDesc } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionHeader, Eyebrow } from "@/components/ui/page-header";
import { OutputBlock, OutputPlaceholder } from "@/components/output/output-block";
import { PostBlock } from "@/components/output/post-block";

/**
 * Phase 5 acceptance surface. Renders every primitive in every variant so a
 * design pass can compare side by side with design/primitives.html. Gated
 * by middleware like every other route; behind /dev/ as a hint that it is a
 * development helper, not a user surface.
 */
export default function PrimitivesPage() {
  return (
    <div className="content-prose" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <PageHeader
        eyebrow="Dev"
        title="Primitives"
        right={
          <>
            <Badge>neutral</Badge>
            <Badge variant="success">success</Badge>
            <Badge variant="danger">danger</Badge>
            <Badge variant="accent">accent</Badge>
          </>
        }
      />

      <section>
        <SectionHeader>Buttons</SectionHeader>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Button variant="primary" size="sm">Primary sm</Button>
          <Button variant="secondary" size="sm">Secondary sm</Button>
          <Button variant="ghost" size="sm">Ghost sm</Button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Button variant="primary" size="lg">Primary lg</Button>
          <Button variant="secondary" size="lg">Secondary lg</Button>
          <Button variant="primary" streaming streamingLabel="Drafting">
            Draft
          </Button>
        </div>
      </section>

      <section>
        <SectionHeader>Inputs</SectionHeader>
        <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
          <div>
            <Label htmlFor="t1">Topic <span className="hint">a sentence or two</span></Label>
            <Input id="t1" placeholder="Why most AI pilots stall at the proof-of-concept stage" />
          </div>
          <div>
            <Label htmlFor="t2">Password (large)</Label>
            <Input id="t2" type="password" size="lg" placeholder="••••••••••••" />
          </div>
          <div>
            <Label htmlFor="t3">Provider</Label>
            <Select id="t3" defaultValue="anthropic">
              <option value="anthropic">Anthropic · claude-sonnet-4-6</option>
              <option value="openai">OpenAI · gpt-4o</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="t4">Voice profile <span className="hint">markdown · ~120 lines is plenty</span></Label>
            <Textarea id="t4" variant="mono" rows={6} defaultValue={"# Voice\n\n- Direct, peer-to-peer\n- Concrete examples\n"} />
          </div>
          <div>
            <Label htmlFor="t5">Draft</Label>
            <Textarea id="t5" rows={5} placeholder="Paste a draft to quality check" />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader>Cards</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
          <Card>
            <CardTitle>Static card</CardTitle>
            <CardDesc>Surface fill, hairline border, 8px radius. No shadow.</CardDesc>
          </Card>
          <Card interactive>
            <CardTitle>Interactive card</CardTitle>
            <CardDesc>Lifts border on hover. No transform, no shadow.</CardDesc>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader>Output block</SectionHeader>
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          <OutputPlaceholder>Output will appear here</OutputPlaceholder>
          <OutputBlock status="live" label="Streaming">
            {"This is a partial response, streaming in token by token. The terracotta caret blinks on the trailing edge"}
          </OutputBlock>
          <OutputBlock
            status="done"
            label="Complete · 312 tokens"
            actions={
              <>
                <Button variant="ghost" size="sm">Copy</Button>
                <Button variant="ghost" size="sm">Quality check</Button>
              </>
            }
          >
            <PostBlock meta="Draft · 184 words">
              <p>
                Most AI pilots stall before they hit production. Not because the model is wrong,
                but because the work to get there is unglamorous.
              </p>
              <p>
                You need a data path. You need an eval. You need someone who owns the rough edges.
              </p>
            </PostBlock>
          </OutputBlock>
          <OutputBlock
            status="fail"
            label="Request failed · 529"
            actions={<Button variant="secondary" size="sm">Try again</Button>}
          >
            <span className="muted">
              Anthropic returned a 529 (overloaded) after 142 tokens. Your draft so far is below.
            </span>
          </OutputBlock>
        </div>
      </section>

      <section>
        <SectionHeader>Eyebrows</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <Eyebrow>Workspace</Eyebrow>
          <Eyebrow>Using voice · 47 examples</Eyebrow>
        </div>
      </section>
    </div>
  );
}
