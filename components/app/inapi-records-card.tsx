import { AlertTriangle, Database, FileSearch, Workflow } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInapiInspectionPayload } from "@/lib/inapi-inspection"

export async function InapiRecordsCard() {
  try {
    const payload = await getInapiInspectionPayload()
    const { summary, recentRecords, recentRuns, actions } = payload

    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Inspeccion INAPI real</CardTitle>
          <CardDescription>Vista operativa de registros persistidos, cobertura taxonomica y corridas recientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricChip
              icon={Database}
              label="Registros reales"
              value={String(summary.totalRecords)}
              help="Solo source = inapi"
            />
            <MetricChip
              icon={FileSearch}
              label="Asignaciones Niza"
              value={String(summary.totalNizaAssignments)}
              help="Relacion trademark_record_niza"
            />
            <MetricChip
              icon={AlertTriangle}
              label="Asignaciones Viena"
              value={String(summary.totalVienaAssignments)}
              help={
                summary.totalVienaAssignments === 0
                  ? "Aun no se esta poblando desde detalle INAPI"
                  : `${summary.sampleWithoutViena} sin Viena en la muestra`
              }
            />
            <MetricChip
              icon={Workflow}
              label="Corridas"
              value={`${summary.completedRuns}/${summary.totalRuns}`}
              help={`Completadas / total · fallidas: ${summary.failedRuns}`}
            />
          </div>

          <div className="rounded-xl border border-slate-200/20 bg-slate-100/5 p-4">
            <p className="text-sm font-medium text-foreground">Comando sugerido de backfill Viena</p>
            <code className="mt-2 block overflow-x-auto rounded-lg bg-slate-950/80 px-3 py-2 text-xs text-cyan-200">
              {actions.vienaBackfillCommand}
            </code>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Registros recientes</h3>
              <Badge variant="outline">Muestra: {recentRecords.length}</Badge>
            </div>
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
                      <div className="font-medium">{record.nombre}</div>
                      <div className="text-xs text-muted-foreground">id {record.id.slice(0, 8)} · fileSeq {record.fileSeq || "-"}</div>
                    </TableCell>
                    <TableCell>{record.numeroSolicitud || "-"}</TableCell>
                    <TableCell>{record.numeroRegistro || "-"}</TableCell>
                    <TableCell>{record.estado}</TableCell>
                    <TableCell>{record.nizaCodes.length ? record.nizaCodes.slice(0, 3).join(", ") : "-"}</TableCell>
                    <TableCell>
                      {record.vienaCodes.length ? (
                        record.vienaCodes.slice(0, 3).join(", ")
                      ) : (
                        <span className="text-amber-300">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(record.updatedAt).toLocaleString("es-CL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Runs recientes</h3>
              <Badge variant="outline">Muestra: {recentRuns.length}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      <Badge variant={run.status === "completed" ? "secondary" : run.status === "failed" ? "destructive" : "outline"}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.searchType}</TableCell>
                    <TableCell>{run.query}</TableCell>
                    <TableCell>{run.totalFetched}</TableCell>
                    <TableCell>{run.insertedCount} / {run.updatedCount}</TableCell>
                    <TableCell>{new Date(run.createdAt).toLocaleString("es-CL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Inspeccion INAPI real</CardTitle>
          <CardDescription>No fue posible cargar el estado operativo de los registros persistidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-rose-300">{String(error)}</p>
        </CardContent>
      </Card>
    )
  }
}

function MetricChip({
  icon: Icon,
  label,
  value,
  help,
}: {
  icon: typeof Database
  label: string
  value: string
  help: string
}) {
  return (
    <div className="rounded-xl border border-slate-200/20 bg-slate-100/5 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-300" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
    </div>
  )
}
