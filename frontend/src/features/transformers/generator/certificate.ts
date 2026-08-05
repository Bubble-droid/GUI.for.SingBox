import type { SingBoxCert } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
import type { CertificateConfig } from '@profiles/certificate'

export const generateCertificate = (certificate: CertificateConfig): SingBoxCert => {
  return filterInvalidProps({
    ...certificate,
  })
}
