import { execSync } from 'child_process'

/**
 * Get certificate ARNs from AWS ACM by domain names
 * This is a workaround to ensure we always get the correct certificates
 */
export async function getCertificateArns(domains: string[]): Promise<Map<string, string>> {
  const certificateMap = new Map<string, string>()

  try {
    // List all certificates in us-east-1
    const output = execSync(
      'aws acm list-certificates --region us-east-1 --output json',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    )

    const data = JSON.parse(output)
    const certificates = data.CertificateSummaryList || []

    // For each domain, find the matching certificate
    for (const domain of domains) {
      for (const cert of certificates) {
        if (cert.DomainName === domain) {
          certificateMap.set(domain, cert.CertificateArn)
          break
        }
      }
    }
  } catch (error) {
    console.warn('Could not fetch certificate ARNs from AWS ACM')
  }

  return certificateMap
}
