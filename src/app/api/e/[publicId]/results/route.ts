import { error, json } from "@/lib/api";
import { findEventByPublicId, loadResults, toPublic } from "@/lib/queries";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/e/[publicId]/results">,
) {
  const { publicId } = await ctx.params;
  const event = await findEventByPublicId(publicId);
  if (!event) return error(404, "イベントが見つかりません");
  const results = await loadResults(event);
  return json({ event: toPublic(event), ...results });
}
