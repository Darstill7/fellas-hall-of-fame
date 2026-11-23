"""Resolve active-season boundary starts with independently sourced NFL schedule and roster evidence."""
import csv, io, json, hashlib, urllib.request
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from collections import Counter, defaultdict
D=Path("data-integrity/historical-trade-draft-audits")
SCHEDULE="https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
ROSTER="https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_2026.csv"
def read(url):
    with urllib.request.urlopen(url,timeout=60) as r: raw=r.read()
    return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))),hashlib.sha256(raw).hexdigest()
def team(x): return {"JAC":"JAX","WSH":"WAS","LA":"LAR","OAK":"LV","SD":"LAC"}.get(x,x)
live=json.loads((D/"2026-live-acquisition-preview.json").read_text())
games,gh=read(SCHEDULE)
rosters,rh=read(ROSTER)
teams=defaultdict(set)
for r in rosters:
    if r.get("sleeper_id") and r.get("week") and r.get("team"):
        teams[(r["sleeper_id"].removesuffix(".0"),int(float(r["week"])))].add(team(r["team"]))
index=defaultdict(list)
for a in live["ledger"]: index[(a["roster"],a["player_id"])].append(a)
results=[]
seen=set()
for r in live["unresolved"]:
    pid=str(r["player_id"]); week=r["week"]; key=(r["roster"],pid,week)
    assert key not in seen;seen.add(key)
    candidates=index[(r["roster"],pid)]
    ts={team(pid)} if pid.isalpha() else teams.get((pid,week),set())
    gs=[g for g in games if g["season"]=="2026" and g["week"]==str(week) and ts.intersection({team(g["home_team"]),team(g["away_team"])})]
    out={**r,"teams":sorted(ts),"game_ids":[g["game_id"] for g in gs],"status":"UNRESOLVED_GAME","credit":None,"evaluations":[]}
    if not candidates: out["status"]="NO_ACQUISITION_CANDIDATE"
    elif len(ts)==1 and len(gs)==1 and gs[0].get("gametime"):
        k=datetime.fromisoformat(gs[0]["gameday"]+"T"+gs[0]["gametime"]).replace(tzinfo=ZoneInfo("America/New_York")).astimezone(timezone.utc)
        km=k.timestamp()*1000;out["scheduled_kickoff_utc"]=k.isoformat()
        for a in candidates:
            start=a["time"];end=a["exit_ms"]
            if (a["week"]!=0 and not start) or (a["exit_transaction"] and not end): verdict="MISSING_TIMESTAMP"
            elif (start and abs(start-km)<=3600000) or (end and abs(end-km)<=3600000): verdict="NEAR_KICKOFF"
            elif start<km and (end is None or end>km): verdict="SUPPORTS"
            else: verdict="CONFLICTS"
            out["evaluations"].append({"id":a["id"],"category":a["category"],"start_ms":start,"exit_ms":end,"verdict":verdict})
        supported=[e for e in out["evaluations"] if e["verdict"]=="SUPPORTS"]
        if any(e["verdict"] in ("NEAR_KICKOFF","MISSING_TIMESTAMP") for e in out["evaluations"]): out["status"]="TIMING_REVIEW_REQUIRED"
        elif len(supported)==1:
            out["status"]="SCHEDULE_TIMING_SUPPORTS_CREDIT";out["credit"]=supported[0]
        elif len(supported)>1: out["status"]="OVERLAPPING_OWNERSHIP"
        else: out["status"]="NO_TIMING_SUPPORTED_CANDIDATE"
    results.append(out)
assert len(results)==live["coverage"]["unattributed_starts"]
supported=[r for r in results if r["credit"]]
strict=live["coverage"]["strict_starts"];observed=live["coverage"]["observed_starts"]
assert strict+len(results)==observed
report={"status":"RESEARCH_ONLY_SCHEDULE_PROXY_NOT_ACTUAL_LOCK_PROOF","completedThrough":live["completedThrough"],"coverage":{"observed":observed,"strict":strict,"schedule_supported":len(supported),"remaining":len(results)-len(supported),"combined_pct":round(100*(strict+len(supported))/observed,4),"statuses":dict(Counter(r["status"] for r in results))},"sources":{"schedule":{"url":SCHEDULE,"sha256":gh},"roster":{"url":ROSTER,"sha256":rh}},"rows":results,"limitations":["Scheduled kickoff does not prove actual lineup lock.","One-hour proximity excluded; original strict ledger unchanged."]}
(D/"2026-live-acquisition-kickoff-evidence.json").write_text(json.dumps(report,indent=2)+"\n")
print("LIVE ACQUISITION KICKOFF COVERAGE "+json.dumps(report["coverage"]))
print("LIVE ACQUISITION REMAINING "+json.dumps([r for r in results if not r["credit"]]))
