import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbListAppointmentTypes, dbFindAppt, dbFindApptByShareToken } from "./db.server";

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const services = await dbListAppointmentTypes({ publishedOnly: true });
  return { services };
});

export const getService = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    id: z.string().min(1).max(80),
    shareToken: z.string().max(64).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    let s = await dbFindAppt(data.id);
    if (!s) throw new Error("Service not found");
    // Unpublished services require either a valid share token OR ownership (we keep it simple
    // and rely on the share token; organisers preview from /organiser/services/$id).
    if (!s.isPublished) {
      if (!data.shareToken || data.shareToken !== s.shareToken) {
        // Allow share-token lookup as a secondary path
        if (data.shareToken) {
          const byToken = await dbFindApptByShareToken(data.shareToken);
          if (byToken && byToken.id === data.id) {
            s = byToken;
            return { service: s };
          }
        }
        throw new Error("This service isn't available for booking right now.");
      }
    }
    return { service: s };
  });
