import { AlertTriangle, Database, FileSearch, Workflow } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInapiInspectionPayload } from "@/lib/inapi-inspection"

export async function InapiRecordsCard() {
  try {
    const payload = await getInapiInspectionPayload()
    const { summary, recentRecords, recentRuns, actions } = payload

    return (
      <section className="rounded-[10px] bg-[#13272D] p-4 sm:p-6" aria-labelledby="inapi-records-title">
        <div className="border-b border-border/80 pb-5">
          <div className="flex items-center gap-2 text-[#96B5A6]">
            <Database className="h-4 w-4" />
            <p className="text-[10px] font-medium uppercase tracking-[0.16em]">Persistencia y cobertura</p>
          </div>
          <h3 id="inapi-records-title" className="mt-2 text-xl font-light tracking-[-0.025em] text-[#E7DFCE]">
            Inspección de registros INAPI
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Registros persistidos, cobertura taxonómica y corridas recientes observadas en la plataforma.
          </p>
        </div>

        <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
          <MetricChip icon={Database} label="Registros reales" value={String(summary.totalRecords)} help="Sólo source = inapi" />
          <MetricChip icon={FileSearch} label="Asignaciones Niza" value={String(summary.totalNizaAssignments)} help="Relación trademark_record_niza" />
          <MetricChip
            icon={AlertTriangle}
            label="Asignaciones Viena"
            value={String(summary.totalVienaAssignments)}
            help={summary.totalVienaAssignments === 0 ? "Aún no se está poblando desde detalle INAPI" : `${summary.sampleWithoutViena} sin Viena en la muestra`}
          />
          <MetricChip
            icon={Workflow}
            label="Corridas"
            value={`${summary.completedRuns}/${summary.totalRuns}`}
            help={`Completadas / total · fallidas: ${summary.failedRuns}`}
          />
        </div>

        <div className="mt-5 rounded-[10px] bg-[#0F2A33] p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">Backfill Viena sugerido</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Comando operativo informado por la capa de inspección.</p>
          <code className="mt-3 block overflow-x-auto rounded-[8px] bg-[#091A20] px-3 py-2 text-xs text-[#B7D3D1]">
            {actions.vienaBackfillCommand}
          </code>
        </div>

        <DataTableSection title="Registros recientes" sample={recentRecords.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Solicitud</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Niza</TableHead>
                <TableHead>Viena</TableHead>
                <TableHead>Actualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="max-w-[280px] whitespace-normal">
                    <div className="font-medium text-white">{record.nombre}</div>
                    <div className="text-xs text-muted-foreground">id {record.id.slice(0, 8)} · fileSeq {record.fileSeq || "-"}</div>
                  </TableCell>
                  <TableCell>{record.numeroSolicitud || "-"}</TableCell>
                  <TableCell>{record.numeroRegistro || "-"}</TableCell>
                  <TableCell>{record.estado}</TableCell>
                  <TableCell>{record.nizaCodes.length ? record.nizaCodes.slice(0, 3).join(", ") : "-"}</TableCell>
                  <TableCell>
                    {record.vienaCodes.length ? record.vienaCodes.slice(0, 3).join(", ") : <span className="text-[#D6A46F]">Pendiente</span>}
                  </TableCell>
                  <TableCell>{new Date(record.updatedAt).toLocaleString("es-CL")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableSection>

        <DataTableSection title="Corridas recientes" sample={recentRuns.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Fetched</TableHead>
                <TableHead>Insert / Update</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell><Badge className={runStatusClass(run.status)}>{run.status}</Badge></TableCell>
                  <TableCell>{run.searchType}</TableCell>
                  <TableCell>{run.query}</TableCell>
                  <TableCell>{run.totalFetched}</TableCell>
                  <TableCell>{run.insertedCount} / {run.updatedCount}</TableCell>
                  <TableCell>{new Date(run.createdAt).toLocaleString("es-CL")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableSection>
      </section>
    )
  } catch (error) {
    return (
      <section className="rounded-[10px] bg-[#13272D] p-4 sm:p-6" aria-labelledby="inapi-records-error-title">
        <div className="flex items-start gap-3 rounded-[10px] bg-[#3A2525] p-4 text-[#E8AAA3]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <h3 id="inapi-records-error-title" className="text-sm font-medium">No fue posible cargar la inspección INAPI</h3>
            <p className="mt-1 text-xs leading-5">{String(error)}</p>
          </div>
        </div>
      </section>
    )
  }
}

function MetricChip({ icon: Icon, label, value, help }: { icon: typeof Database; label: string; value: string; help: string }) {
  return (
    <div className="min-h-[128px] bg-[#0F2A33] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#96B5A6]" />
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{help}</p>
    </div>
  )
}

function DataTableSection({ title, sample, children }: { title: string; sample: number; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Inspección</p>
          <h4 className="mt-1 text-lg font-light text-[#E7DFCE]">{title}</h4>
        </div>
        <span className="text-xs text-muted-foreground">Muestra: {sample}</span>
      </div>
      <div className="overflow-x-auto border-y border-border/80">{children}</div>
    </div>
  )
}

function runStatusClass(status: string) {
  if (status === "completed") return "bg-[#173B37] text-[#96B5A6]"
  if (status === "failed") return "bg-[#3A2525] text-[#E8AAA3]"
  if (status === "running") return "bg-[#332C24] text-[#D6A46F]"
  return "bg-[#26363A] text-[#BDBEBD]"
}
