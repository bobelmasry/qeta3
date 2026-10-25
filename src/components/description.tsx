import type { Block } from "@/lib/types";

type Section = { kind: "h" | "p"; text: string } | { kind: "ul"; items: string[] };

/** Group consecutive list items into lists; spec rows are rendered separately as a table. */
function sections(blocks: Block[]): Section[] {
  const out: Section[] = [];
  for (const b of blocks) {
    if (b.t === "spec") continue;
    if (b.t === "li") {
      const last = out.at(-1);
      if (last?.kind === "ul") last.items.push(b.text);
      else out.push({ kind: "ul", items: [b.text] });
    } else {
      out.push({ kind: b.t, text: b.text });
    }
  }
  return out;
}

export function Description({ blocks }: { blocks: Block[] }) {
  return (
    <div className="max-w-none space-y-3 text-[15px] leading-relaxed">
      {sections(blocks).map((s, i) =>
        s.kind === "h" ? (
          <h3 key={i} className="pt-2 text-base font-semibold">
            {s.text}
          </h3>
        ) : s.kind === "ul" ? (
          <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted">
            {s.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{s.text}</p>
        ),
      )}
    </div>
  );
}

export function Specs({ blocks }: { blocks: Block[] }) {
  const rows = blocks.filter((b) => b.t === "spec");
  if (rows.length === 0) return null;
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-line">
        {rows.map((r, i) => (
          <tr key={i}>
            <th scope="row" className="w-2/5 py-2.5 pr-4 text-left align-top font-normal text-muted">
              {r.k}
            </th>
            <td className="py-2.5 align-top font-medium">{r.v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function hasProse(blocks: Block[]) {
  return blocks.some((b) => b.t !== "spec");
}
