import type { CertificateStore } from '@features/constant/kernel'

export interface CertificateConfig {
  store: CertificateStore
  certificate: string[]
  certificate_path: string[]
  certificate_directory_path: string[]
}
