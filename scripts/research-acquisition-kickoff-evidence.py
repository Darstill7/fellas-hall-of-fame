"""Research-only timing scenario for unattributed acquisition starts."""
import csv, io, json, hashlib, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
from collections import Counter
D=Path("data-integrity/historical-trade-draft-audits")
SCHEDULE="https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
ROSTER="https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_{}.csv"
def read(url):
    with urllib.request.urlopen(url, timeout=60) as response:
        raw=response.read()
    return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))),hashlib.sha256(raw).hexdigest()
def team(x):
    return {"JAC":"JAX","WSH":"WAS","LA":"LAR","OAK":"LV","SD":"LAC"}.get(x,x)
games,h=read(SCHEDULE)
sources={"schedule":{"url":SCHEDULE,"sha256":h},"rosters":{}}
audit=json.loads((D/"unattributed-starter-audit-research.json").read_text())
ledger=json.loads((D/"acquisition-hall-of-fame-research.json").read_text())
def key(y,r,p,a): return (y,int(r),str(p),str(a))
index={key(a["year"],a["roster"],a["player_id"],a["id"]):a for a in ledger["ledger"]}
assert len(index)==len(ledger["ledger"])
results=[]
for year in range(2020,2026):
    roster,h=read(ROSTER.format(year))
    sources["rosters"][str(year)]={"url":ROSTER.format(year),"sha256":h}
    teams={}
    for r in roster:
        if r.get("sleeper_id") and r.get("week") and r.get("team") and r.get("game_type","REG")=="REG":
            teams.setdefault((r["sleeper_id"].removesuffix(".0"),int(float(r["week"]))),set()).add(team(r["team"]))
    for r in (x for x in audit["rows"] if x["year"]==year):
        pid=r["player_id"]; week=r["week"]
        ts={team(pid)} if r["position"]=="DEF" and pid.isalpha() else teams.get((pid,week),set())
        gs=[g for g in games if g["season"]==str(year) and g["week"]==str(week) and g["game_type"]=="REG" and ts.intersection({team(g["home_team"]),team(g["away_team"])})]
        out={**r,"teams":sorted(ts),"game_ids":[g["game_id"] for g in gs],"status":"UNRESOLVED_GAME","credit":None,"evaluations":[]}
        if not r["candidates"]: out["status"]="NO_ACQUISITION_CANDIDATE"
        elif len(ts)==1 and len(gs)==1 and gs[0].get("gametime"):
            k=datetime.fromisoformat(gs[0]["gameday"]+"T"+gs[0]["gametime"]).replace(tzinfo=ZoneInfo("America/New_York")).astimezone(timezone.utc)
            km=k.timestamp()*1000
            out["scheduled_kickoff_utc"]=k.isoformat()
            for c in r["candidates"]:
                a=index[key(year,r["roster"],pid,c["id"])]
                start=a["time"]; end=a.get("exit_ms")
                assert "exit_ms" in a
                if (a["week"]!=0 and not start) or (a["exit_transaction"] and not end):
                    verdict="MISSING_TIMESTAMP"
                elif (start and abs(start-km)<=3600000) or (end and abs(end-km)<=3600000):
                    verdict="NEAR_KICKOFF"
                elif start<km and (end is None or end>km):
                    verdict="SUPPORTS"
                else: verdict="CONFLICTS"
                out["evaluations"].append({"id":a["id"],"category":a["category"],"start_ms":start,"exit_ms":end,"verdict":verdict})
            supported=[e for e in out["evaluations"] if e["verdict"]=="SUPPORTS"]
            ambiguous=any(e["verdict"] in ("MISSING_TIMESTAMP","NEAR_KICKOFF") for e in out["evaluations"])
            # Check all acquisitions for this season/roster/player, not just boundary candidates.
            overlapping=[a for a in ledger["ledger"] if a["year"]==year and int(a["roster"])==int(r["roster"]) and a["player_id"]==pid and a["time"]<km and (a.get("exit_ms") is None or a["exit_ms"]>km)]
            if ambiguous: out["status"]="TIMING_REVIEW_REQUIRED"
            elif len(supported)==1 and len(overlapping)==1 and overlapping[0]["id"]==supported[0]["id"]:
                out["status"]="SCHEDULE_TIMING_SUPPORTS_CREDIT";out["credit"]=supported[0]
            elif supported: out["status"]="OVERLAPPING_OR_CONFLICTING_OWNERSHIP"
            else: out["status"]="NO_TIMING_SUPPORTED_CANDIDATE"
        results.append(out)
assert len(results)==702
assert len({(r["year"],r["week"],r["roster"],r["player_id"]) for r in results})==702
coverage=dict(Counter(r["status"] for r in results))
supported=[r for r in results if r["credit"]]
by_category={}
for c in sorted({r["credit"]["category"] for r in supported}):
    rs=[r for r in supported if r["credit"]["category"]==c]
    by_category[c]={"starts":len(rs),"pf":round(sum(r["pf"] for r in rs),2)}
output={"status":"RESEARCH_ONLY_SCHEDULE_PROXY_NOT_ACTUAL_LOCK_PROOF","coverage":coverage,"supported_by_category":by_category,"sources":sources,"rows":results,"limitations":["Scheduled kickoff is not actual lineup lock evidence","One hour proximity excluded","Strict ledger unchanged","No candidate inferred without original completed transaction or draft evidence"]}
(D/"acquisition-kickoff-evidence-research.json").write_text(json.dumps(output,indent=2)+"\n")
print("ACQUISITION KICKOFF COVERAGE "+json.dumps(coverage))
print("ACQUISITION KICKOFF CATEGORY "+json.dumps(by_category))
