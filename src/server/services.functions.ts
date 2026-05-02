import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { APPT_TYPES, findAppt } from "./services-catalog.server";

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  return { services: APPT_TYPES };
});

export const getService = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const s = findAppt(data.id);
    if (!s) throw new Error("Service not found");
    return { service: s };
  });
