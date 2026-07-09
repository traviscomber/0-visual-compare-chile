import type { Marca } from '@/types/marca'

export const API_PORTAL_MARCAS: Marca[] = [
  {
    id: '1',
    nombre: 'VISUAL COMPARE',
    solicitante: 'Visual Compare Ltd',
    numeroRegistro: '4020230615001',
    niza: ['42', '35'],
    viena: ['26.03.01'],
    estado: 'Registrada',
    fecha: '2023-06-15',
    pais: 'CL',
    descripcion: 'Plataforma de comparacion visual de logos y marcas',
  },
  {
    id: '2',
    nombre: 'COMPARE PRO',
    solicitante: 'Software Innovations Inc',
    numeroRegistro: '4020230322002',
    niza: ['42', '09'],
    viena: ['26.01.01'],
    estado: 'Registrada',
    fecha: '2023-03-22',
    pais: 'US',
    descripcion: 'Software profesional de comparacion',
  },
  {
    id: '3',
    nombre: 'LOGO MATCH',
    solicitante: 'Design Studio Chile',
    numeroRegistro: '4020240110003',
    niza: ['41', '42'],
    viena: ['26.03.01', '26.03.15'],
    estado: 'Pendiente',
    fecha: '2024-01-10',
    pais: 'CL',
    descripcion: 'Sistema de emparejamiento de logos',
  },
  {
    id: '4',
    nombre: 'MARCA SHIELD',
    solicitante: 'IP Protection Services',
    numeroRegistro: '4020221105004',
    niza: ['45'],
    viena: ['26.04.01'],
    estado: 'Registrada',
    fecha: '2022-11-05',
    pais: 'MX',
    descripcion: 'Proteccion de marcas registradas',
  },
  {
    id: '5',
    nombre: 'VISUAL TECH',
    solicitante: 'Technology Innovations',
    numeroRegistro: '4020230820005',
    niza: ['42', '35', '09'],
    viena: ['26.03.01'],
    estado: 'Registrada',
    fecha: '2023-08-20',
    pais: 'AR',
    descripcion: 'Tecnologia visual avanzada',
  },
]

export const API_PORTAL_NIZA = [
  { codigo: '09', titulo: 'Aparatos e instrumentos cientificos y tecnologicos' },
  { codigo: '35', titulo: 'Publicidad y gestion de negocios' },
  { codigo: '41', titulo: 'Educacion y entretenimiento' },
  { codigo: '42', titulo: 'Servicios cientificos y tecnologicos' },
  { codigo: '45', titulo: 'Servicios legales y de seguridad' },
]

export const API_PORTAL_VIENA = [
  { codigo: '26.01.01', titulo: 'Formas geometricas simples' },
  { codigo: '26.03.01', titulo: 'Cabezas o rostros humanos estilizados' },
  { codigo: '26.03.15', titulo: 'Partes faciales y expresiones' },
  { codigo: '26.04.01', titulo: 'Escudos y blasones' },
  { codigo: '28.01.01', titulo: 'Patrones abstractos' },
]

export function findMarcaById(id: string) {
  return API_PORTAL_MARCAS.find((marca) => marca.id === id) ?? null
}
