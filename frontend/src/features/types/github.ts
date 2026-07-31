export interface GitHubApiReleaseAsset {
  name: string
  browser_download_url: string
  digest: string
  uploader: {
    login: string
  }
}

export interface GitHubApiRelease {
  message?: string
  tag_name: string
  prerelease: boolean
  assets: GitHubApiReleaseAsset[]
}
