# ADR-0004: Hosting: MoCTI on-prem primary, cloud warm standby, CDN/object storage for lesson media

- Status: Accepted (David, 27 Nov 2026)
- Date: 2026-11-27
- Deciders: David Ogoo (Christex), CTO, SLDTP tech lead
- Relates to: engineering-plan ADR-004 and ADR-006 (media); CTO stack-review hosting options; OPS-01 to OPS-05; ADR-0017

## Context and problem statement

The ToR places the platform in the MoCTI data centre. The CTO's stack review laid out three options: full on-prem; hybrid with named SaaS; cloud with residency safeguards. Learners at 16 district hubs need video and offline downloads over poor links, and a single on-prem site has no recovery path if the DC is down. Privy (identity) is already a named SaaS dependency (ADR-0017).

## Decision drivers

- Government data stays primarily at MoCTI
- Recover from a DC outage within a stated time
- Deliver video and offline downloads to hubs without saturating one DC uplink
- MoCTI staff can operate it
- No PII on public infrastructure

## Considered options

1. Full on-prem: app VM + DB VM, media on disk, backups to a MoCTI target only
2. **On-prem primary + cloud warm standby + CDN/object storage for public lesson media (chosen)**
3. Cloud primary with residency safeguards
4. Active-active across DC and cloud (rejected)

## Decision outcome

Option 2.
- **Primary at MoCTI**: app VM (Nginx, one `sldtp.service` running the Next.js standalone server on Node 24 LTS, private files on disk) and DB VM (MariaDB 10.11, private IP). Releases are CI tarballs from a tag, switched by symlink.
- **Cloud warm standby**: nightly `mariadb-dump`, encrypted (age/GPG) before upload, plus an encrypted rclone sync of private files, to a standby bucket with 30-day retention. A stopped or minimal standby VM with the same image and release tag. Failover is manual by runbook: start, restore, smoke test, switch DNS. **RPO 24 hours, RTO 8 hours** (proposed for the Inception Report). Restore is tested before UAT, then quarterly, with timings recorded.
- **CDN + object storage for public lesson media** (video renditions, captions, lesson PDFs): uploaded by the content import script; streamed and downloaded for offline use from the CDN, with CORS so the service worker can cache it.
- **No-PII rule**: only public course content goes to the CDN bucket. CVs, certificates, logos and every database row stay on MoCTI infrastructure; the standby copies are encrypted and the key is held by MoCTI outside the cloud account. Provider and region are agreed with MoCTI in writing.
- Rejected: active-active / live replication (two writable sites, conflict handling and network dependencies far beyond a 300-user beta); Kubernetes; Docker in production (Compose stays for local dev).

Hours (provisional, on top of OPS-03): CDN and object storage 8, content pipeline upload 6, offline download test against the CDN 6, warm standby 10, restore drill and failover runbook 10. **Total 40 hours.**

### Consequences

- Good: a real recovery path; hubs pull media from a CDN edge instead of the DC uplink; still simple (no replication, no orchestration).
- Running cost: the standby, the bucket and the CDN still need a provider quote. Privy Core, the other recurring external cost, is about $299/month (ADR-0017; [deployment](../architecture/deployment.md)).
- Bad: two cloud accounts or services to pay for and govern; encrypted PII leaves the DC at rest; a manual failover loses up to 24 hours of data.

### Confirmation

Timed restore on the standby recorded in the runbook before UAT; CI check that the media import refuses non-media paths; DNS TTL documented.
