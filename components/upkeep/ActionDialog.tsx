"use client";

import { useState, type ReactNode } from "react";
import type { ActionResult } from "@/app/actions/space";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/display";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useMachineMutation } from "@/components/machines/useMachineMutation";

/**
 * One dialog for every upkeep action: the server page renders the fields, this collects them. Checkboxes listed
 * in `booleans` become true/false; every other field is sent as typed, merged with `fixed` (ids, slug).
 */
export function ActionDialog({ action, fixed, booleans = [], trigger, triggerVariant = "secondary", title, description, submitLabel, success, children }: {
  action: (input: unknown) => Promise<ActionResult<unknown>>; fixed: Record<string, string>; booleans?: string[];
  trigger: string; triggerVariant?: "primary" | "secondary"; title: string; description?: string; submitLabel: string; success: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const mutation = useMachineMutation();
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!mutation.pending) setOpen(next); }}>
      <DialogTrigger asChild><Button size="sm" variant={triggerVariant}>{trigger}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader title={title} description={description} />
        <form className="flex min-h-0 flex-col" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const values: Record<string, unknown> = { ...fixed };
          for (const [key, value] of form.entries()) if (typeof value === "string" && !booleans.includes(key)) values[key] = value;
          for (const key of booleans) values[key] = form.get(key) === "on" || form.get(key) === "true";
          mutation.run(() => action(values), success, () => setOpen(false));
        }}>
          <DialogBody>
            <fieldset disabled={mutation.pending} className="flex flex-col gap-4">
              {mutation.error ? <Callout tone="danger" role="alert">{mutation.error}</Callout> : null}
              {Object.keys(mutation.fieldErrors).length ? <ul className="text-caption text-danger-fg" role="alert">
                {Object.entries(mutation.fieldErrors).map(([field, errors]) => <li key={field}>{errors[0]}</li>)}</ul> : null}
              {children}
            </fieldset>
          </DialogBody>
          <DialogFooter><Button variant="secondary" type="button" disabled={mutation.pending} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={mutation.pending}>{submitLabel}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
