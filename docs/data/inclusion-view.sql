-- Migration 0001_inclusion_report_view (raw SQL in a Prisma migration; ADR-0016).
-- The ONLY place that reads User.disabilityWgss for reporting. Reports and exports query this view
-- through src/sldtp/reports/inclusion.ts; nothing else parses the JSON.
-- Washington Group Short Set: each domain is answered 1 (no difficulty) .. 4 (cannot do at all).
-- A domain flag is "a lot of difficulty" or worse (>= 3). pwd = any domain flag (the WG disability cut-off).
-- NULL means "not answered" and is never counted as "no".
CREATE OR REPLACE VIEW `InclusionReport` AS
SELECT
  u.`id`        AS userId,
  u.`hubId`     AS hubId,
  u.`district`  AS district,
  u.`gender`    AS gender,
  CAST(JSON_VALUE(u.`disabilityWgss`, '$.seeing')        AS UNSIGNED) >= 3 AS seeingFlag,
  CAST(JSON_VALUE(u.`disabilityWgss`, '$.hearing')       AS UNSIGNED) >= 3 AS hearingFlag,
  CAST(JSON_VALUE(u.`disabilityWgss`, '$.mobility')      AS UNSIGNED) >= 3 AS mobilityFlag,
  CAST(JSON_VALUE(u.`disabilityWgss`, '$.cognition')     AS UNSIGNED) >= 3 AS cognitionFlag,
  CAST(JSON_VALUE(u.`disabilityWgss`, '$.selfCare')      AS UNSIGNED) >= 3 AS selfCareFlag,
  CAST(JSON_VALUE(u.`disabilityWgss`, '$.communication') AS UNSIGNED) >= 3 AS communicationFlag,
  CASE
    WHEN u.`disabilityWgss` IS NULL THEN NULL
    WHEN GREATEST(
      COALESCE(CAST(JSON_VALUE(u.`disabilityWgss`, '$.seeing')        AS UNSIGNED), 0),
      COALESCE(CAST(JSON_VALUE(u.`disabilityWgss`, '$.hearing')       AS UNSIGNED), 0),
      COALESCE(CAST(JSON_VALUE(u.`disabilityWgss`, '$.mobility')      AS UNSIGNED), 0),
      COALESCE(CAST(JSON_VALUE(u.`disabilityWgss`, '$.cognition')     AS UNSIGNED), 0),
      COALESCE(CAST(JSON_VALUE(u.`disabilityWgss`, '$.selfCare')      AS UNSIGNED), 0),
      COALESCE(CAST(JSON_VALUE(u.`disabilityWgss`, '$.communication') AS UNSIGNED), 0)
    ) >= 3 THEN TRUE
    ELSE FALSE
  END AS pwd
FROM `User` u
WHERE u.`role` = 'LEARNER'
  AND u.`demographicsConsentAt` IS NOT NULL;
-- No phone, email, name or national-id columns: aggregate reports only.
