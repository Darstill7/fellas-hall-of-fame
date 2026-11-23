"""Research only: compare completed transaction timestamps with historical scheduled kickoff.
A scheduled start is a timing proxy, not proof of the actual Sleeper lineup lock.
Never modify canonical scoring or automatically award points.
"""
import csv, io, json, hashlib, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
D=Path("data-integrity/historical-trade-draft-audits")
SCHEDULE="https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv"
ROSTER="https://github.com/nflverse/nflverse-data/releases/download/weekly_rosters/roster_weekly_{}.csv"
def read(url):
    with urllib.request.urlopen(url, timeout=60) as response:
        raw=response.read()
    return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))),hashlib.sha256(raw).hexdigest()
def normalize_team(x):
    return {"JAC":"JAX","WSH":"WAS","LA":"LAR","OAK":"LV","SD":"LAC"}.get(x,x)
def kickoff(game):
    return datetime.fromisoformat(game["gameday"]+"T"+game["gametime"]).replace(tzinfo=ZoneInfo("America/New_York")).astimezone(timezone.utc)
def iso(ms):
    return datetime.fromtimestamp(float(ms)/1000,tz=timezone.utc)
games, schedule_hash=read(SCHEDULE)
assert games and {"season","week","game_type","gameday","gametime","home_team","away_team","game_id"} <= games[0].keys()
rows=[]; sources={"schedule":{"url":SCHEDULE,"sha256":schedule_hash},"weekly_rosters":{}}
for year in range(2020,2026):
    report=json.loads((D/f"{year}-ownership-review.json").read_text())
    roster, h=read(ROSTER.format(year))
    assert roster and {"sleeper_id","week","team"} <= roster[0].keys()
    sources["weekly_rosters"][str(year)]={"url":ROSTER.format(year),"sha256":h}
    team_index={}
    for r in roster:
        pid=r["sleeper_id"].removesuffix(".0")
        if pid and r["week"] and r["team"] and r.get("game_type","REG")=="REG":
            team_index.setdefault((pid,int(float(r["week"]))),set()).add(normalize_team(r["team"]))
    for t in report["trade_results"]:
        for s in t["sides"]:
            for p in s["players"]:
                for b in p["boundary"]:
                    week=b["week"]; pid=p["player_id"]
                    acquisition=b["reason"]=="ACQUISITION_WEEK_LOCK_PROOF_REQUIRED"
                    timestamp=p["acquired_status_updated"] if acquisition else p.get("exit_status_updated")
                    teams=team_index.get((pid,week),set())
                    if pid.isalpha(): teams={normalize_team(pid)}
                    candidates=[g for g in games if g["season"]==str(year) and g["week"]==str(week) and g["game_type"]=="REG" and teams.intersection({normalize_team(g["home_team"]),normalize_team(g["away_team"])})]
                    row={"year":year,"trade_id":t["id"],"manager":s["manager"],"roster":s["roster"],"player_id":pid,"player":p.get("observed_player_name"),"week":week,"points":b["points"],"boundary":b["reason"],"transaction_ms":timestamp,"candidate_teams":sorted(teams),"candidate_games":[g["game_id"] for g in candidates],"status":"UNRESOLVED"}
                    if len(teams)==1 and len(candidates)==1 and timestamp and candidates[0]["gametime"]:
                        k=kickoff(candidates[0]); tx=iso(timestamp); minutes=(tx-k).total_seconds()/60
                        row.update(kickoff_utc=k.isoformat(),transaction_utc=tx.isoformat(),minutes_after_scheduled_kickoff=round(minutes,2))
                        if abs(minutes)<=60:
                            row["status"]="NEAR_SCHEDULED_KICKOFF_REVIEW"
                        elif acquisition:
                            row["status"]="TIMING_SUPPORTS_CREDIT" if minutes<0 else "TIMING_CONFLICTS_WITH_CREDIT"
                        else:
                            row["status"]="TIMING_SUPPORTS_CREDIT" if minutes>0 else "TIMING_CONFLICTS_WITH_CREDIT"
                    rows.append(row)
from collections import Counter
coverage=dict(Counter(r["status"] for r in rows))
assert len(rows)==74, f"Boundary inventory changed: {len(rows)}"
output={"status":"RESEARCH_ONLY_SCHEDULE_PROXY_NOT_ACTUAL_LOCK_PROOF","coverage":coverage,"sources":sources,"rows":rows,"limitations":["Scheduled kickoff may differ from actual kickoff or fantasy-platform lock","Weekly roster team may be ambiguous; do not infer from modern player team","No canonical scores are updated","A post-kickoff exit does not itself establish ownership at lock when other same-week moves occurred"]}
(D/"boundary-kickoff-evidence-research.json").write_text(json.dumps(output,indent=2)+"\n")
print("BOUNDARY TIMING COVERAGE "+json.dumps(coverage))
print("BOUNDARY TIMING EVIDENCE "+json.dumps(rows))
