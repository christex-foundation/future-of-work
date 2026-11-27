#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (c) 2026 Christex Foundation
"""List upstream (SuperteamDAO/earn) changes since our last triage and classify them.

Lives at scripts/sldtp/upstream-triage.py. See docs/fork-and-upstream-sync.md.
Reads:
  .sldtp/upstream-baseline   one line: last upstream SHA fully triaged
  .sldtp/deleted-paths       deletion ledger, one glob per line ('#' comments), e.g. src/features/credits/**
                             a line "old/glob/** -> src/sldtp/new/" records a MOVE: upstream edits to the old
                             path are still reported (class MOVED) because the code lives on under src/sldtp/
  .sldtp/upstream-log.tsv    decisions, tab-separated: upstream_sha, decision, our_sha or -, who, note
Prints a markdown table, one row per upstream first-parent commit (usually one PR merge).
Exit 1 with --check if a commit touching kept paths has no decision in upstream-log.tsv.
"""
import argparse, fnmatch, os, re, subprocess, sys

SEC = re.compile(r"\b(security|secur|vuln|cve-|ghsa-|xss|csrf|ssrf|idor|injection|sanitiz|escape|authn|authz|authori[sz]ation|permission|"
                 r"rate.?limit|ratelimit|exploit|leak|bypass|unauthori[sz]ed|owner check|replay|harden|security headers|"
                 r"txn.validation)\b", re.I)
FIX = re.compile(r"\b(fix|bug|hotfix|patch|crash|broken|regression|revert)\b", re.I)
DEP_FILES = {"package.json", "pnpm-lock.yaml"}

def git(*a):
    return subprocess.run(["git", *a], check=True, capture_output=True, text=True).stdout

def read_lines(p):
    if not os.path.exists(p):
        return []
    return [l.strip() for l in open(p) if l.strip() and not l.lstrip().startswith("#")]

def deleted(path, globs):
    for g in globs:
        g2 = g.rstrip("/")
        if fnmatch.fnmatch(path, g) or path == g2 or path.startswith(g2.rstrip("*").rstrip("/") + "/"):
            return True
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--upstream", default="upstream/main")
    ap.add_argument("--ours", default="HEAD")
    ap.add_argument("--base", help="override .sldtp/upstream-baseline")
    ap.add_argument("--ledger", default=".sldtp/deleted-paths")
    ap.add_argument("--log", default=".sldtp/upstream-log.tsv")
    ap.add_argument("--all", action="store_true", help="also list IRRELEVANT rows")
    ap.add_argument("--check", action="store_true", help="exit 1 on untriaged commits touching kept paths")
    a = ap.parse_args()

    base = a.base or (read_lines(".sldtp/upstream-baseline") or [None])[0]
    if not base:
        sys.exit("no baseline: pass --base or write .sldtp/upstream-baseline")
    entries = read_lines(a.ledger)
    globs = [e for e in entries if "->" not in e]
    moved = [e.split("->")[0].strip() for e in entries if "->" in e]
    decided = {l.split("\t")[0][:9] for l in read_lines(a.log)}
    ours = set(git("ls-tree", "-r", "--name-only", a.ours).split("\n"))

    shas = git("rev-list", "--first-parent", "--reverse", f"{base}..{a.upstream}").split()
    rows, untriaged, counts = [], 0, {}
    for sha in shas:
        subj = git("log", "-1", "--format=%s", sha).strip()
        body = git("log", "-1", "--format=%b", sha)
        date = git("log", "-1", "--format=%ad", "--date=short", sha).strip()
        files = [f for f in git("diff", "--name-only", f"{sha}^1", sha).split("\n") if f]
        kept = [f for f in files if f in ours and not deleted(f, globs)]
        mov = [f for f in files if deleted(f, moved)]
        deps = [f for f in files if f in DEP_FILES]
        text = subj + " " + body
        if not kept and not deps and not mov:
            cls = "IRRELEVANT"          # only deleted paths or brand-new upstream paths
        elif SEC.search(text):
            cls = "SECURITY"
        elif not kept and mov:
            cls = "MOVED"               # touches code we moved into src/sldtp/: port by hand if it matters
        elif deps and not [f for f in kept if f not in DEP_FILES]:
            cls = "DEPS"
        elif FIX.search(text):
            cls = "BUGFIX-KEPT"
        else:
            cls = "FEATURE-KEPT"
        counts[cls] = counts.get(cls, 0) + 1
        short = sha[:9]
        status = "decided" if short in decided else ("-" if cls == "IRRELEVANT" else "TODO")
        if status == "TODO":
            untriaged += 1
        if cls != "IRRELEVANT" or a.all:
            rows.append(f"| {short} | {date} | {cls} | {status} | {len(kept)}/{len(files)} | "
                        f"{subj[:70].replace('|','/')} | {', '.join((kept or mov)[:3])}{' …' if len(kept or mov)>3 else ''} |")
    print(f"Upstream {base[:9]}..{git('rev-parse','--short=9',a.upstream).strip()}: {len(shas)} first-parent commits; "
          + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())) + f"; untriaged {untriaged}\n")
    print("| upstream | date | class | status | kept/all files | subject | kept files |")
    print("| --- | --- | --- | --- | --- | --- | --- |")
    print("\n".join(rows))
    if a.check and untriaged:
        sys.exit(1)

if __name__ == "__main__":
    main()
