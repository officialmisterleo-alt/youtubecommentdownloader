import IntlLandingPage from '@/components/IntlLandingPage'
import { intlMetadata } from '@/lib/intl-pages'

export const metadata = intlMetadata('pt')

export default function Page() {
  return <IntlLandingPage lang="pt" />
}
