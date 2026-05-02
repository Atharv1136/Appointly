import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbListAppointmentTypes, dbFindAppt } from "./db.server";

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const services = await dbListAppointmentTypes({ publishedOnly: true });
  return { services };
});

export const getService = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const s = await dbFindAppt(data.id);
    if (!s) throw new Error("Service not found");
    return { service: s };
  });
