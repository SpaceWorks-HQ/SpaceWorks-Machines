"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitionJobAction } from "@/app/actions/jobs";
import type { JobCommand } from "@/lib/jobs/commands";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/display";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useMachineMutation } from "@/components/machines/useMachineMutation";
import { JobCommandFields, type CommandOptions } from "./JobCommandFields";
import { commandValues } from "./formValues";

export function JobActionDialog({ spaceSlug, jobId, kind, label, options, override = false }: {
  spaceSlug: string; jobId: string; kind: JobCommand["kind"]; label: string; options: CommandOptions; override?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const mutation = useMachineMutation();
  const router = useRouter();
  return <>
    {warnings.map((w) => <Callout key={w} tone="warning">{w}</Callout>)}
    <Dialog open={open} onOpenChange={(next) => { if (!mutation.pending) setOpen(next); }}>
      <DialogTrigger asChild><Button variant="secondary">{label}</Button></DialogTrigger>
      <DialogContent><DialogHeader title={label} description="This change is recorded in the job timeline." />
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
          event.preventDefault();
          const command = commandValues(kind, new FormData(event.currentTarget), options.currency);
          mutation.run(() => transitionJobAction({ spaceSlug, jobId, command }), "Job updated", (data) => {
            setOpen(false); setWarnings(data?.warnings ?? []);
            if (kind === "reprint" && data) router.push(`/dashboard/${spaceSlug}/jobs/${data.number}`);
          });
        }}><DialogBody><fieldset disabled={mutation.pending} className="flex flex-col gap-5">
          {mutation.error ? <Callout tone="danger" role="alert">{mutation.error}</Callout> : null}
          <JobCommandFields kind={kind} options={options} override={override} />
        </fieldset></DialogBody><DialogFooter><Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={mutation.pending}>Close</Button><Button type="submit" loading={mutation.pending}>{label}</Button></DialogFooter></form>
      </DialogContent>
    </Dialog>
  </>;
}
