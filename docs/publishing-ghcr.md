# Publishing this fork's Docker image

This repository publishes its own container image to GitHub Container Registry
(GHCR). The image name is derived from the GitHub repository, so for this fork
it is:

```text
ghcr.io/vwc-ict-telecom/send
```

GitHub normalizes the registry name to lowercase. Do not use the upstream
`registry.gitlab.com/timvisee/send` image when you want this fork's branding
and changes.

## One-time setup

1. Keep the GitHub repository private.
2. Commit and push `.github/workflows/publish-container.yml` to the default
   branch.
3. In the repository's **Settings → Actions → General**, ensure workflows have
   **Read and write permissions**. The workflow itself requests only
   `contents: read` and `packages: write`.
4. Publish the first image using one of the release methods below. A package
   created by this workflow is linked to this repository and inherits its
   private visibility.
5. Verify it at `https://github.com/orgs/VWC-ICT-Telecom/packages/container/package/send`.
   Open **Package settings** and confirm its visibility is **Private** and that
   this repository has admin access. This is also where you can grant another
   private repository or team access if it must pull the image.

No GitHub secret is needed to publish: Actions supplies a short-lived
`GITHUB_TOKEN` to the workflow.

## Publish a release image

Use a version tag whenever you have chosen a stable version of your fork. From
your clone:

```powershell
git switch main
git pull origin main
git tag v3.5.1-custom.1
git push origin v3.5.1-custom.1
```

The workflow then publishes both of these tags from that exact commit:

```text
ghcr.io/vwc-ict-telecom/send:v3.5.1-custom.1
ghcr.io/vwc-ict-telecom/send:latest
```

Alternatively, open **Actions → Publish container image → Run workflow** and
enter an image tag such as `edge` or `v3.5.1-custom.1`. Manual runs publish
only the tag entered there; they do not update `latest`.

The workflow does *not* run on normal branch pushes. That makes it safe to
sync upstream changes, review them, and publish only when you intentionally
release them.

## Pull and run the private image

On every machine that will pull the image, create a GitHub classic personal
access token with `read:packages` permission. If the package belongs to an
organization with SSO, authorize the token for that organization as well. Log
in and pull:

```powershell
$token = Read-Host 'GitHub token' -AsSecureString
$plainToken = [System.Net.NetworkCredential]::new('', $token).Password
$plainToken | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
docker pull ghcr.io/vwc-ict-telecom/send:v3.5.1-custom.1
```

Use a fixed version tag in production rather than `latest`. The existing
Docker configuration needs Redis and persistent storage; an example is:

```powershell
docker network create send-net
docker run -d --name send-redis --network send-net -v ${PWD}/redis:/data redis:alpine redis-server --appendonly yes
docker run -d --name send --network send-net -p 1443:1443 -v ${PWD}/uploads:/uploads `
  -e BASE_URL=https://send.example.com `
  -e REDIS_HOST=send-redis `
  -e FILE_DIR=/uploads `
  ghcr.io/vwc-ict-telecom/send:v3.5.1-custom.1
```

Replace `https://send.example.com` with the public URL. Put HTTPS termination
and access control in a reverse proxy in front of Send for Internet-facing
deployments.

For a full Portainer-ready stack with every server configuration value written
out, use [`docker-compose.production.yml`](../docker-compose.production.yml).
Set `BASE_URL` to your public URL, then deploy it as a Portainer Stack after
adding GHCR as a private registry. Pin `SEND_IMAGE` to a release tag in the
Stack's environment variables, for example
`ghcr.io/vwc-ict-telecom/send:v3.5.1-custom.1`.

## Routine update checklist

1. Fetch and merge the upstream changes into your fork, resolving conflicts in
   your custom logo, text, and configuration carefully.
2. Test the resulting commit locally (at minimum `docker build -t send:test .`).
3. Choose a new fork-specific version tag and push it.
4. Wait for the Actions run to succeed, then deploy the new immutable tag.
5. Keep the previous tag until the deployed version is known to work; roll back
   by redeploying that previous tag if needed.

Avoid moving or reusing version tags. A new tag makes it clear which source
commit is running and keeps rollback straightforward.

## Troubleshooting

* **`denied: permission_denied: write_package`**: confirm the repository
  Actions setting allows workflow write permissions. If a package with the
  same name already exists, open its package settings and give this repository
  write/admin access, or delete the unused package before the first publish.
* **`denied` while pulling**: log in to `ghcr.io` with a token that has
  `read:packages` and is authorized for the organization. Also check the
  package's access settings.
* **Image name rejected**: GHCR image names must be lowercase. The workflow
  handles this automatically; use lowercase when typing an image name or tag.
* **Upstream image appears after deployment**: ensure your compose file or
  deployment references `ghcr.io/vwc-ict-telecom/send:<version>`, not the
  upstream GitLab registry.

## References

GitHub's official documentation covers the [Container
registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
and [publishing packages with GitHub
Actions](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions).
