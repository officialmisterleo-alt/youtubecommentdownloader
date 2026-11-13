import IntlLandingPage from '@/components/IntlLandingPage'
import { intlMetadata } from '@/lib/intl-pages'

export const metadata = intlMetadata('es')

export default function Page() {
  return <IntlLandingPage lang="es" />
}
