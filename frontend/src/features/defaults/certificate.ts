import type { CertificateStore } from '@features/constant/kernel'
import type { CertificateConfig } from '@profiles/certificate'

export const createCertificate = (): CertificateConfig => ({
  store: '' as CertificateStore,
  certificate: [],
  certificate_path: [],
  certificate_directory_path: [],
})
