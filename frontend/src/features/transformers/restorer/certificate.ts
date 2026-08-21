import { createCertificate } from '@defaults/certificate'
import type { SingBoxCert } from '@features/types/sing-box'
import { normalizeArray } from '@features/utils/helper'
import type { CertificateConfig } from '@profiles/certificate'

export const restoreCertificate = (raw: SingBoxCert = {}): CertificateConfig => {
  const template = createCertificate()
  return {
    ...template,
    ...raw,
    certificate: normalizeArray(raw.certificate),
    certificate_path: normalizeArray(raw.certificate_path),
    certificate_directory_path: normalizeArray(raw.certificate_directory_path),
  }
}
