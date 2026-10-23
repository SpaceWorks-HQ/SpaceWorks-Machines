"use client";

import { useMemo, useState } from "react";
import type { SpaceRole } from "@prisma/client";
import { MemberRoleActions } from "@/components/team/MemberRoleActions";
import { filterTeam, matchesFilter, type TeamFilter, type SpaceMemberRow } from "@/components/team/memberSummary";
import { Avatar, Chip, EmptyState } from "@/components/ui/display";
import { SearchInput } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FILTERS: Array<{ value: TeamFilter; label: string }> = [
  { value: "everyone", label: "Everyone" },
  { value: "managers", label: "Owners and space managers" },
  { value: "machines", label: "Machine side" },
];

const AVATAR_TONES: Record<SpaceRole, "ink" | "warning" | "success" | "accent" | "neutral"> = { OWNER: "ink", MANAGER: "warning", MACHINE_MANAGER: "accent", OPERATOR: "neutral", TECHNICIAN: "success", VIEWER: "neutral", MEMBER: "neutral" };

export function TeamList({
  spaceSlug,
  actorRole,
  rows,
  showEmail,
}: {
  spaceSlug: string;
  actorRole: SpaceRole;
  rows: SpaceMemberRow[];
  showEmail: boolean;
}) {
  const [filter, setFilter] = useState<TeamFilter>("everyone");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map(({ value }) => [value, rows.filter((row) => matchesFilter(row.role, value)).length])) as Record<TeamFilter, number>,
    [rows],
  );
  const visible = useMemo(() => filterTeam(rows, filter, query), [rows, filter, query]);

  return (
    <section aria-labelledby="team-title" className="flex min-w-0 flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="team-title" className="text-h4 text-ink">Staff</h2>
        <div className="w-full min-w-0 sm:w-[260px]">
          <label htmlFor="team-search" className="sr-only">Search staff</label>
          <SearchInput
            id="team-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder={showEmail ? "Search by name or email" : "Search by name"}
            autoComplete="off"
            className="py-2 sm:text-sm"
          />
        </div>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as TeamFilter)}>
        <TabsList aria-label="Filter by role">
          {FILTERS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <span className="font-medium text-ink-muted">{counts[value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {FILTERS.map(({ value }) => (
          <TabsContent key={value} value={value} className="pt-3.5">
            {visible.length === 0 ? (
              <EmptyState>{query.trim() ? "No one matches that search." : "No one here yet."}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((row) => (
                  <li key={row.id} className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-lg border border-line bg-panel px-4 py-3">
                    <Avatar name={row.name ?? row.email ?? null} size="md" tone={AVATAR_TONES[row.role]} />
                    <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-bold text-ink">{row.name ?? "Unnamed"}</span>
                        {row.isYou ? <Chip size="sm" className="shrink-0">You</Chip> : null}
                      </span>
                      <span className="truncate text-caption text-ink-muted">
                        {showEmail && row.email ? `${row.email} · ` : ""}Joined {row.joinedLabel}
                      </span>
                    </div>
                    <div className="ml-auto flex min-w-0 max-w-full flex-wrap justify-end gap-2">
                      <MemberRoleActions
                        spaceSlug={spaceSlug}
                        targetUserId={row.userId}
                        role={row.role}
                        actorRole={actorRole}
                        isYou={row.isYou}
                        memberName={row.name ?? row.email ?? undefined}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
