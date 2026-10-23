import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

/**
 * The space behind a public page. Active and suspended spaces have one (a suspended one says it isn't
 * taking makers); applications, refusals and archived spaces don't.
 */
export const loadPublicSpace = cache(async (slug: string) => {
  const space = await prisma.space.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, description: true, logoUrl: true, accentColor: true, status: true, visibility: true, joinPolicy: true,
      city: true, region: true, country: true, website: true, contactEmail: true, contactPhone: true, locale: true,
    },
  });
  if (!space || (space.status !== "ACTIVE" && space.status !== "SUSPENDED")) notFound();
  return space;
});
