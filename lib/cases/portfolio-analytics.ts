export type PortfolioCase={id:string;title:string;status:string;created_at:string;updated_at:string}
export type PortfolioReview={id:string;case_id:string;reviewer_id:string;status:"pending"|"approved"|"changes_requested"|"cancelled";created_at:string;responded_at:string|null;deadline_at:string|null;governance_round_id:string|null}
export type PortfolioEvent={case_id:string;event_type:string;payload:Record<string,unknown>|null;occurred_at:string}

const HOUR=3_600_000
const DAY=24*HOUR
const ms=(value:string)=>Date.parse(value)
const diffHours=(from:string,to:string)=>Math.max(0,(ms(to)-ms(from))/HOUR)
const avg=(values:number[])=>values.length?values.reduce((sum,v)=>sum+v,0)/values.length:null
const median=(values:number[])=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);const mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2}

export function buildPortfolioAnalytics(input:{cases:PortfolioCase[];reviews:PortfolioReview[];events:PortfolioEvent[];now?:Date}){
  const now=input.now??new Date()
  const nowIso=now.toISOString()
  const responded=input.reviews.filter(r=>r.responded_at&&r.status!=="cancelled")
  const responseHours=responded.map(r=>diffHours(r.created_at,r.responded_at!))
  const withDeadline=responded.filter(r=>r.deadline_at)
  const onTime=withDeadline.filter(r=>ms(r.responded_at!)<=ms(r.deadline_at!))
  const pending=input.reviews.filter(r=>r.status==="pending")
  const pendingHours=pending.map(r=>diffHours(r.created_at,nowIso))
  const overduePending=pending.filter(r=>r.deadline_at&&ms(r.deadline_at)<now.getTime())
  const changes=input.reviews.filter(r=>r.status==="changes_requested"&&r.responded_at)
  const unresolvedBlocked=changes.filter(change=>{
    const laterRound=input.reviews.some(r=>r.case_id===change.case_id&&ms(r.created_at)>ms(change.responded_at!)&&r.status!=="cancelled")
    return !laterRound
  })
  const blockedHours=unresolvedBlocked.map(r=>diffHours(r.responded_at!,nowIso))

  const createdByCase=new Map<string,string>()
  const decidedAtByCase=new Map<string,string>()
  for(const event of input.events){
    if(event.event_type==="case_created"&&!createdByCase.has(event.case_id))createdByCase.set(event.case_id,event.occurred_at)
    if(event.event_type==="status_changed"&&event.payload?.to==="decided")decidedAtByCase.set(event.case_id,event.occurred_at)
  }
  const cycleHours:number[]=[]
  for(const [caseId,decidedAt] of decidedAtByCase){
    const createdAt=createdByCase.get(caseId)??input.cases.find(c=>c.id===caseId)?.created_at
    if(createdAt)cycleHours.push(diffHours(createdAt,decidedAt))
  }
  const cutoff30=now.getTime()-30*DAY
  const decisions30=[...decidedAtByCase.values()].filter(value=>ms(value)>=cutoff30).length
  const activeCases=input.cases.filter(c=>c.status!=="decided"&&c.status!=="archived").length

  return {
    historical:{avgReviewResponseHours:avg(responseHours),medianReviewResponseHours:median(responseHours),responseSample:responseHours.length,slaOnTimeRate:withDeadline.length?onTime.length/withDeadline.length:null,slaSample:withDeadline.length,avgDecisionCycleHours:avg(cycleHours),medianDecisionCycleHours:median(cycleHours),decisionSample:cycleHours.length,decisionsLast30Days:decisions30},
    live:{pendingReviews:pending.length,overdueReviews:overduePending.length,avgWaitingHours:avg(pendingHours),medianWaitingHours:median(pendingHours),blockedCases:new Set(unresolvedBlocked.map(r=>r.case_id)).size,avgBlockedHours:avg(blockedHours),activeCases},
  }
}

export function formatDuration(hours:number|null){if(hours===null||!Number.isFinite(hours))return "Sin muestra";if(hours<1)return `${Math.max(1,Math.round(hours*60))} min`;if(hours<48)return `${hours.toFixed(hours<10?1:0)} h`;const days=hours/24;return `${days.toFixed(days<10?1:0)} d`}
export function formatRate(rate:number|null){return rate===null?"Sin muestra":`${Math.round(rate*100)}%`}
