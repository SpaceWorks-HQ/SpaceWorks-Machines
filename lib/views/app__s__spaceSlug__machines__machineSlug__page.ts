import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { loadPublicMachineSpace } from "@/lib/publicSpace";
import { machineFileUrl } from "@/lib/machines/fileAccess";
import { PUBLIC_MACHINE, PUBLIC_PHOTO, publicMachine, publicPhoto } from "@/lib/machines/publicQueries";

const readView = cache(async (spaceSlug: string, machineSlug: string) => {
  const space = await loadPublicMachineSpace(spaceSlug);
  const row = await prisma.machine.findFirst({
    where: { spaceId: space.id, slug: machineSlug, isPublic: true, retiredAt: null },
    select: { ...PUBLIC_MACHINE,
      photos: { where: { spaceId: space.id }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: PUBLIC_PHOTO },
      documents: { where: { spaceId: space.id, isPublic: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, title: true, storageKey: true, kind: true },
      },
    },
  });
  if (!row) notFound();
  return { space, machine: publicMachine(row), photos: row.photos.map(publicPhoto),
    documents: row.documents.map((document) => ({ id: document.id, title: document.title, kind: document.kind, url: machineFileUrl(document.storageKey) })),
  };
});

export async function loadPublicMachineView({ params }: { params: Promise<{ spaceSlug: string; machineSlug: string }> }) {
  const { spaceSlug, machineSlug } = await params;
  return readView(spaceSlug, machineSlug);
}
