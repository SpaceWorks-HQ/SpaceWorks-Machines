import Link from "next/link";
import type { Metadata } from "next";
import { loadMachinePrinterView } from "@/lib/views/app__dashboard__spaceSlug__machines__machineSlug__printer__page";
import { savePrinterAction } from "@/app/actions/integrations";
import { SpacePageHeader } from "@/components/dashboard/space/SpacePageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Chip, DetailList, ProgressBar } from "@/components/ui/display";
import { CheckboxField } from "@/components/ui/choice";
import { Dropdown, Field, Input } from "@/components/ui/field";
import { MachineStatusChip } from "@/components/machines/MachineStatusChip";
import { ActionDialog } from "@/components/upkeep/ActionDialog";
import { AutoRefresh, PrinterControls } from "@/components/printers/PrinterControls";
import { formatDayTime } from "@/lib/format/datetime";

export const metadata: Metadata = { title: "Printer connection", robots: { index: false, follow: false } };
const STATE = { idle: ["Idle", "neutral"], printing: ["Printing", "info"], paused: ["Paused", "warning"], error: ["Error", "danger"], offline: ["Offline", "neutral"] } as const;
const minutes = (seconds: number | null) => seconds === null ? "None" : seconds < 120 ? `${seconds} s` : `${Math.round(seconds / 60)} min`;

export default async function MachinePrinterPage({ params }: { params: Promise<{ spaceSlug: string; machineSlug: string }> }) {
  const { space, machine, adapters, connection, telemetry } = await loadMachinePrinterView({ params });
  const settings = connection?.settings ?? { pollSeconds: 15, syncMachineStatus: true, autoCompleteJobs: true };
  const live = connection?.enabled && connection.adapter !== "MANUAL";
  return (
    <div className="flex flex-col gap-7 pb-4">
      {live ? <AutoRefresh seconds={5} /> : null}
      <div><Button asChild size="sm" variant="secondary"><Link href={`/dashboard/${space.slug}/machines/${machine.slug}`}>Back to {machine.name}</Link></Button></div>
      <SpacePageHeader space={space} title={`Printer: ${machine.name}`} description="Connect the machine so jobs start on the printer and finish from its telemetry."
        actions={<><MachineStatusChip status={machine.status} />
          <ActionDialog action={savePrinterAction} fixed={{ spaceSlug: space.slug, machineId: machine.id }} booleans={["enabled", "syncMachineStatus", "autoCompleteJobs"]}
            trigger={connection ? "Edit connection" : "Set up connection"} triggerVariant="primary" title="Printer connection" submitLabel="Save connection" success="Connection saved">
            <Field label="Connection type"><Dropdown name="adapter" defaultValue={connection?.adapter ?? "SIMULATED"}>
              {adapters.filter((adapter) => adapter.available).map((adapter) => <option key={adapter.kind} value={adapter.kind}>{adapter.label}</option>)}</Dropdown></Field>
            <Field label="Address" optional helperText="For network printers."><Input name="baseUrl" maxLength={300} defaultValue={connection?.baseUrl} /></Field>
            <Field label="Device id" optional helperText="Serial number or user name, when the printer needs one."><Input name="deviceId" maxLength={120} defaultValue={connection?.deviceId} /></Field>
            <Field label="Key or access code" optional helperText={connection?.hasSecret ? "Saved. Leave blank to keep it." : "Stored encrypted and never shown again."}><Input name="secret" type="password" autoComplete="off" maxLength={500} /></Field>
            <Field label="Check every (seconds)"><Input name="pollSeconds" type="number" min={15} max={3600} defaultValue={settings.pollSeconds} /></Field>
            <CheckboxField name="enabled" defaultChecked={connection?.enabled ?? true} label="Connection on" />
            <CheckboxField name="autoCompleteJobs" defaultChecked={settings.autoCompleteJobs} label="Finish jobs from the printer" description="Complete or fail the running job when the print ends." />
            <CheckboxField name="syncMachineStatus" defaultChecked={settings.syncMachineStatus} label="Mirror printing and idle onto the machine" description="Never overrides maintenance, offline or reserved." />
          </ActionDialog></>} />

      <section aria-label="Connection types" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adapters.map((adapter) => <Card key={adapter.kind} className={adapter.available ? "" : "opacity-70"}>
          <div className="flex items-start justify-between gap-2"><h2 className="text-h3">{adapter.label}</h2>
            {!adapter.available ? <Chip size="sm" tone="outline">Coming soon</Chip> : connection?.adapter === adapter.kind ? <Chip size="sm" tone="success">In use</Chip> : null}</div>
          <p className="mt-2 text-body-ui text-ink-secondary">{adapter.description}</p>
        </Card>)}
      </section>

      {connection && telemetry ? <Card as="section" aria-label="Live telemetry">
        <CardHeader title="Live telemetry" description={connection.lastSeenAt ? `Last checked ${formatDayTime(connection.lastSeenAt, space.timezone)}` : "Not checked yet."}
          action={<Chip tone={STATE[telemetry.state][1]}>{STATE[telemetry.state][0]}</Chip>} />
        {connection.lastError ? <p role="alert" className="mb-3 text-caption text-danger-fg">{connection.lastError}</p> : null}
        {telemetry.progress !== null ? <ProgressBar value={telemetry.progress} max={100} label={`Progress ${telemetry.progress} %`} className="mb-4" /> : null}
        <DetailList items={[
          { label: "Print", value: telemetry.jobName ?? "None" },
          { label: "Nozzle", value: telemetry.nozzleC === null ? "No reading" : `${telemetry.nozzleC} °C of ${telemetry.nozzleTargetC ?? 0} °C` },
          { label: "Bed", value: telemetry.bedC === null ? "No reading" : `${telemetry.bedC} °C of ${telemetry.bedTargetC ?? 0} °C` },
          { label: "Elapsed", value: minutes(telemetry.elapsedSeconds) }, { label: "Remaining", value: minutes(telemetry.remainingSeconds) },
          ...(telemetry.error ? [{ label: "Error", value: telemetry.error }] : []),
        ]} />
        {connection.adapter !== "MANUAL" ? <div className="mt-4"><PrinterControls spaceSlug={space.slug} connectionId={connection.id}
          commands={connection.adapter === "SIMULATED" ? ["test", "start", "pause", "resume", "cancel", "fail"] : ["test"]} /></div> : null}
      </Card> : null}

      {connection ? <Card as="section" aria-label="Command log">
        <CardHeader title="Command log" />
        {connection.commands.length ? <ul className="flex flex-col divide-y divide-line">{connection.commands.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span><code>{row.command}</code> <span className="text-caption text-ink-muted">{row.message}</span></span>
          <span className="flex items-center gap-2"><Chip size="sm" tone={row.ok ? "success" : "danger"}>{row.ok ? "Done" : "Refused"}</Chip><span className="text-caption text-ink-muted">{formatDayTime(row.createdAt, space.timezone)}</span></span>
        </li>)}</ul> : <p className="text-body-ui text-ink-muted">No commands yet.</p>}
      </Card> : null}
    </div>
  );
}
