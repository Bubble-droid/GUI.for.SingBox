import type { MessageSchema } from '../types'

export default {
  title: 'Certificate',
  store: {
    title: 'Trusted CA Store',
    system: 'System Trusted CA',
    mozilla: 'Mozilla CA List',
    chrome: 'Chrome Root Store',
    none: 'Empty List',
  },
  certificate: 'Trusted Certificates (PEM)',
  certificate_path: 'Trusted Certificate File Paths',
  certificate_directory_path: 'Trusted Certificate Directory Paths',
} satisfies MessageSchema['certificate']
