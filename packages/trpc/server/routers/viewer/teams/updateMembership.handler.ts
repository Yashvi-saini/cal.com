import { prisma } from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";
import { MembershipRole } from "@calcom/prisma/enums";
import type { TrpcSessionUser } from "@calcom/trpc/server/types";

import { TRPCError } from "@trpc/server";

import type { TUpdateMembershipInputSchema } from "./updateMembership.schema";

type UpdateMembershipOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TUpdateMembershipInputSchema;
};

export const updateMembershipHandler = async ({ ctx, input }: UpdateMembershipOptions) => {
  const { bookingLimits, disableImpersonation, teamId, memberId } = input;

  const membershipFn = await prisma.membership.findFirst({
    where: {
      userId: ctx.user.id,
      teamId,
    },
  });

  const isSelf = ctx.user.id === memberId;
  const isAdminOrOwner =
    membershipFn && (membershipFn.role === MembershipRole.ADMIN || membershipFn.role === MembershipRole.OWNER);

  if (!isSelf && !isAdminOrOwner) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You are not authorized to edit this membership.",
    });
  }

  const data: Prisma.MembershipUpdateInput = {};

  if (disableImpersonation !== undefined) {
    data.disableImpersonation = disableImpersonation;
  }

  if (bookingLimits !== undefined) {
    if (!isAdminOrOwner) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Only admins and owners can update booking limits.",
      });
    }
    data.bookingLimits = bookingLimits ?? Prisma.DbNull;
  }

  return await prisma.membership.update({
    where: {
      userId_teamId: {
        userId: memberId,
        teamId,
      },
    },
    data,
  });
};

export default updateMembershipHandler;
