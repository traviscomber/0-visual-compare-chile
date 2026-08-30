import { buildStrategicChangeCandidates, type StrategicSourceEvent } from '../lib/intelligence/strategic-change-rules.ts'

const referenceDate = new Date('2026-08-30T20:00:00.000Z')

function fail(message: string): never {
  console.error(`Strategic change regression FAIL: ${message}`)
  process.exit(1)
}

function event(
  id: string,
  entity: 'patent' | 'trademark',
  type: string,
  applicant: string,
  record: string,
  daysAgo: number,
  classification: string[] = [],
  status: string | null = null,
): StrategicSourceEvent {
  return {
    id,
    source_record_id: record,
    entity_type: entity,
    event_type: type,
    title: `${entity} ${id}`,
    observed_at: new Date(referenceDate.getTime() - daysAgo * 86_400_000).toISOString(),
    materiality: type === 'new_record' ? 'media' : 'alta',
    before_snapshot: null,
    after_snapshot: { applicant, classification, status },
  }
}

const single = buildStrategicChangeCandidates([
  event('e1', 'patent', 'new_record', 'Empresa Uno SpA', 'p1', 1, ['C02F 1/00']),
], referenceDate)
if (single.length !== 0) fail(`single event must not create a strategic change, got ${single.length}`)

const accelerationEvents = [
  event('e1', 'patent', 'new_record', 'Empresa Uno SpA', 'p1', 4, ['C02F 1/00']),
  event('e2', 'patent', 'new_record', 'Empresa Uno SpA', 'p2', 3, ['C02F 3/00']),
  event('e3', 'trademark', 'new_record', 'Empresa Uno SpA', 'm1', 2, ['42']),
]
const acceleration = buildStrategicChangeCandidates(accelerationEvents, referenceDate)
if (!acceleration.some(item => item.changeType === 'protection_acceleration')) fail('expected protection_acceleration')
if (!acceleration.some(item => item.changeType === 'cross_ip_expansion')) fail('expected cross_ip_expansion')
const crossIp = acceleration.find(item => item.changeType === 'cross_ip_expansion')
if (!crossIp || crossIp.materiality !== 'alta' || crossIp.confidence < 80) fail('cross_ip_expansion must be high materiality with strong confidence')

const technologyEvents = [
  event('t1', 'patent', 'new_record', 'Tecnologías Agua S.A.', 'tp1', 5, ['C02F 1/00']),
  event('t2', 'patent', 'new_record', 'Tecnologías Agua S.A.', 'tp2', 4, ['C02F 3/10']),
  event('t3', 'patent', 'new_record', 'Tecnologías Agua S.A.', 'tp3', 3, ['C02F 9/00']),
]
const technology = buildStrategicChangeCandidates(technologyEvents, referenceDate)
const concentration = technology.find(item => item.changeType === 'technology_concentration')
if (!concentration) fail('expected technology_concentration')
if (concentration.classificationCodes.join(',') !== 'C02F') fail(`expected C02F concentration, got ${concentration.classificationCodes.join(',')}`)

const maturationEvents = [
  event('r1', 'patent', 'registration_added', 'Portafolio Sur Ltda.', 'rp1', 2, ['A01B 1/00'], 'Concedida'),
  event('r2', 'trademark', 'registration_added', 'Portafolio Sur Ltda.', 'rm1', 1, ['35'], 'Registrada'),
]
const maturation = buildStrategicChangeCandidates(maturationEvents, referenceDate)
if (!maturation.some(item => item.changeType === 'portfolio_maturation')) fail('expected portfolio_maturation')

const ownershipEvents = [
  event('o1', 'patent', 'applicant_changed', 'Holding Andino SpA', 'op1', 2),
  event('o2', 'trademark', 'applicant_changed', 'Holding Andino SpA', 'om1', 1),
]
const ownership = buildStrategicChangeCandidates(ownershipEvents, referenceDate)
const ownershipChange = ownership.find(item => item.changeType === 'ownership_concentration')
if (!ownershipChange || ownershipChange.confidence < 85) fail('expected high-confidence ownership_concentration')

const deterministicA = buildStrategicChangeCandidates(accelerationEvents, referenceDate).map(item => item.changeKey).sort().join(',')
const deterministicB = buildStrategicChangeCandidates([...accelerationEvents].reverse(), referenceDate).map(item => item.changeKey).sort().join(',')
if (deterministicA !== deterministicB) fail('candidate keys must be deterministic regardless of event order')

console.log(`Strategic change regression PASS: ${single.length} false positives; ${acceleration.length + technology.length + maturation.length + ownership.length} expected candidates evaluated.`)
