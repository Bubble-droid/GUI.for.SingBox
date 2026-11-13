/**
 * Minimal GitHub Release structure
 * https://docs.github.com/en/rest/releases/releases
 */
export interface GitHubRelease {
  tag_name: string
  prerelease: boolean
  draft: boolean
  assets: {
    name: string
    browser_download_url: string
    digest: string
    uploader: {
      login: string
    }
  }[]
}
