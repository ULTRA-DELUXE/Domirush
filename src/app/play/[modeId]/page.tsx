import { notFound } from "next/navigation";
import { PlayScreen } from "@/components/play/PlayScreen";
import { getMode, listModes } from "@/lib/modes";

export function generateStaticParams() {
  return listModes({ includeHidden: true }).map((mode) => ({ modeId: mode.id }));
}

/** Routed by mode slug, not streak length — this is what makes the registry pluggable (§7.2). */
export default function PlayPage({ params }: { params: { modeId: string } }) {
  if (!getMode(params.modeId)) notFound();
  return <PlayScreen modeId={params.modeId} />;
}
