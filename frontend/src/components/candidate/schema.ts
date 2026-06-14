import { z } from 'zod'
import type { CandidateIdentifiers } from '@/lib/types'

export const schema = z.object({
  nom: z.string(),
  prenom: z.string(),
  ddn: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().optional().or(z.literal('')),
  isikukood: z
    .string()
    .regex(/^\d{11}$/, 'isikukood = 11 digits')
    .optional()
    .or(z.literal('')),
  statut_marital: z.string().optional().or(z.literal('')),
  statut_etudiant: z.boolean(),
  profile_summary: z.string().optional().or(z.literal('')),
})

export type FormValues = z.infer<typeof schema>

export const IDENTIFIER_FIELDS: (keyof CandidateIdentifiers)[] = [
  'nom',
  'prenom',
  'ddn',
  'email',
  'telephone',
  'isikukood',
]
