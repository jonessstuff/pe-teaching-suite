import { useSearchParams } from 'react-router-dom'
import { SPECIALTY_CONTEXTS } from '../constants/moduleHomes'
import { subjectMatchesFilter } from '../constants/modules'

const PE_CONTEXT = {
  slug: 'pe-health',
  config: {
    subject: 'PE',
    moduleLabel: 'PE & Health',
    title: 'PE & Health',
  },
}

function resolveContext(value) {
  if (!value) return null
  if (value === 'pe-health' || value === 'PE & Health') return PE_CONTEXT

  const entry = Object.entries(SPECIALTY_CONTEXTS).find(([slug, config]) =>
    value === slug || value === config.moduleLabel || value === config.title
  )
  if (!entry) return null
  return { slug: entry[0], config: entry[1] }
}

function subjectForContext(context, supportedSubjects) {
  if (!context || supportedSubjects.length === 0) return context?.config.subject ?? null
  if (supportedSubjects.includes(context.config.moduleLabel)) return context.config.moduleLabel
  if (supportedSubjects.includes(context.config.subject)) return context.config.subject
  return supportedSubjects.find((candidate) =>
    subjectMatchesFilter(context.config.subject, candidate)
  ) ?? null
}

export default function useModuleToolContext(supportedSubjects = []) {
  const [searchParams] = useSearchParams()
  const context = resolveContext(searchParams.get('module'))

  if (!context) {
    return {
      active: false,
      moduleLabel: null,
      moduleTitle: null,
      subject: null,
      slug: null,
      homePath: '/',
    }
  }

  return {
    active: true,
    moduleLabel: context.config.moduleLabel,
    moduleTitle: context.config.title,
    subject: subjectForContext(context, supportedSubjects),
    slug: context.slug,
    homePath: `/${context.slug}`,
  }
}
