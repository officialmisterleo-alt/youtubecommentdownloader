import IntlLandingPage from '@/components/IntlLandingPage'
import { intlMetadata } from '@/lib/intl-pages'

export const metadata = intlMetadata('de')

export default function Page() {
  return <IntlLandingPage lang="de" />
}
