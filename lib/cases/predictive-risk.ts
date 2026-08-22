export type RiskLevel="low"|"medium"|"high"|"critical"

export type RiskCase={id:string;priority:"low"|"normal"|"high";updated_at:string}
export type RiskGovernance={case_id:string;current_round_id:string|null;round_deadline_at:string|null;required_approvals:number}
export type RiskReview={case_id:string;status:"pending"|"approved"|"changes_requested"|"cancelled";governance_round_id:string|null;created_at:string;responded_at:string|null;deadline_at:string|null}
export type PredictiveRisk={score:number;level:RiskLevel;reasons:string[];recommendedAction:string;pendingReviews:number;hoursToDeadline:number|null}

const HOUR=3_600_000
const hoursBetween=(from:string,to:string)=>Math.max(0,(Date.parse(to)-Date.parse(from))/HOUR)
function levelFor(score:number):RiskLevel{if(score>=75)return "critical";if(score>=50)return "high";if(score>=25)return "medium";return "low"}

export function buildPredictiveDecisionRisk(input:{caseRow:RiskCase;governance:RiskGovernance|undefined;reviews:RiskReview[];historicalMedianResponseHours:number|null;now?:Date}):PredictiveRisk{
  const now=input.now??new Date();const nowIso=now.toISOString();const governance=input.governance
  const roundReviews=governance?.current_round_id?input.reviews.filter(r=>r.governance_round_id===governance.current_round_id):input.reviews
  const pending=roundReviews.filter(r=>r.status==="pending")
  const priorChanges=input.reviews.filter(r=>r.status==="changes_requested").length
  const oldestPendingHours=pending.length?Math.max(...pending.map(r=>hoursBetween(r.created_at,nowIso))):0
  const deadline=governance?.round_deadline_at??pending.map(r=>r.deadline_at).filter((v):v is string=>Boolean(v)).sort()[0]??null
  const hoursToDeadline=deadline?(Date.parse(deadline)-now.getTime())/HOUR:null
  const staleHours=hoursBetween(input.caseRow.updated_at,nowIso)
  const baseline=input.historicalMedianResponseHours
  let score=0;const reasons:string[]=[]
  if(pending.length>=3){score+=18;reasons.push(`${pending.length} revisores siguen pendientes`)}else if(pending.length===2){score+=10;reasons.push("2 revisores siguen pendientes")}
  if(hoursToDeadline!==null){if(hoursToDeadline<=0){score+=45;reasons.push("el deadline ya venció")}else if(hoursToDeadline<=24){score+=35;reasons.push("queda menos de 1 día para el deadline")}else if(hoursToDeadline<=72){score+=22;reasons.push("quedan menos de 3 días para el deadline")}else if(hoursToDeadline<=168){score+=10;reasons.push("el deadline cae dentro de 7 días")}}
  if(baseline!==null&&pending.length){if(oldestPendingHours>baseline*2){score+=24;reasons.push("la espera supera 2× la mediana histórica del equipo")}else if(oldestPendingHours>baseline*1.5){score+=15;reasons.push("la espera supera 1,5× la mediana histórica del equipo")}}else if(oldestPendingHours>=72){score+=12;reasons.push("hay una revisión esperando más de 72 horas")}
  if(priorChanges>=2){score+=18;reasons.push(`${priorChanges} solicitudes de cambio previas`)}else if(priorChanges===1){score+=9;reasons.push("ya hubo una solicitud de cambios")}
  if(input.caseRow.priority==="high"){score+=10;reasons.push("el caso tiene prioridad alta")}
  if(staleHours>=14*24){score+=14;reasons.push("el caso lleva 14+ días sin movimiento")}else if(staleHours>=7*24){score+=7;reasons.push("el caso lleva 7+ días sin movimiento")}
  score=Math.min(100,score);const level=levelFor(score)
  const recommendedAction=level==="critical"?"Intervenir hoy: resolver el bloqueo o reasignar la revisión.":level==="high"?"Priorizar seguimiento y confirmar responsables antes del deadline.":level==="medium"?"Dar seguimiento preventivo y revisar avance en la próxima jornada.":"Mantener seguimiento normal; no hay señales fuertes de atraso."
  return {score,level,reasons:reasons.slice(0,4),recommendedAction,pendingReviews:pending.length,hoursToDeadline}
}
export const riskLabel:Record<RiskLevel,string>={low:"Bajo",medium:"Medio",high:"Alto",critical:"Crítico"}
