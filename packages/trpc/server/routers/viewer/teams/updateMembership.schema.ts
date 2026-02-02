import { intervalLimitsType } from "@calcom/prisma/zod-utils";
import { z } from "zod";

export type TUpdateMembershipInputSchema = {
  teamId: number;
  memberId: number;
  disableImpersonation?: boolean;
  bookingLimits?: z.infer<typeof intervalLimitsType> | null;
};

export const ZUpdateMembershipInputSchema: z.ZodType<TUpdateMembershipInputSchema> = z.object({
  teamId: z.number(),
  memberId: z.number(),
  disableImpersonation: z.boolean().optional(),
  bookingLimits: intervalLimitsType.optional(),
});
