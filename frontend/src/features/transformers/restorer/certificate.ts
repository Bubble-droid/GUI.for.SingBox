import { createCertificate } from '@defaults/certificate'
import type { SingBoxCert } from '@features/types/sing-box'
import { ensureArray } from '@features/utils/helper'
import type { CertificateConfig } from '@profiles/certificate'

export const restoreCertificate = (raw: SingBoxCert = {}): CertificateConfig => {
  const template = createCertificate()
  return {
    ...template,
    ...raw,
    certificate: ensureArray(raw.certificate),
    certificate_path: ensureArray(raw.certificate_path),
    certificate_directory_path: ensureArray(raw.certificate_directory_path),
  }
}
