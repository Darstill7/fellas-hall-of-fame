"""Independent gamebook actual-start research for nine historical near-kickoff exceptions.
ESPN summary is secondary evidence; missing actual timestamps stay unresolved.
"""
import json, urllib.request, re
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter
D=Path("data-integrity")
source=json.loads((D/"acquisition-final-exceptions-20261123.json").read_text())
# Team at time of game, not current player team. Match exact schedule timestamp and team.
teams={"2118":"PIT","LV":"LV","4950":"ARI","5536":"TEN","7606":"KC","10222":"GB","5001":"HOU","9494":"DEN","11603":"SEA"}
def get(url):
    with urllib.request.urlopen(url,timeout=45) as r: return json.load(r)
def dt(s): return datetime.fromisoformat(s.replace("Z","+00:00"))
rows=[]
for a in source["near_kickoff"]:
    scheduled=dt(a["scheduled_kickoff_utc"])
    day=scheduled.strftime("%Y%m%d")
    url="https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates="+day+"&limit=100"
    out={**a,"team":teams[a["player_id"]],"scoreboard_source":url,"status":"ACTUAL_START_NOT_VERIFIED"}
    try:
        events=get(url).get("events",[])
        matches=[e for e in events if any(c.get("team",{}).get("abbreviation")==out["team"] for comp in e.get("competitions",[]) for c in comp.get("competitors",[])) and abs((dt(e["date"])-scheduled).total_seconds())<7200]
        if len(matches)!=1:
            out["status"]="GAME_ID_UNRESOLVED"
        else:
            e=matches[0];out["espn_event_id"]=e["id"]
            summary="https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event="+e["id"]
            out["summary_source"]=summary
            d=get(summary)
            # Do not treat scheduled date or a generic update clock as actual kickoff.
            plays=[p for drive in d.get("drives",{}).get("previous",[]) for p in drive.get("plays",[]) if p.get("period",{}).get("number")==1 and p.get("type",{}).get("text","").lower()=="kickoff"]
            evidence=[]
            for p in plays:
                if p.get("clock",{}).get("displayValue") not in ("15:00","14:59"): continue
                for field in ["wallclock","wallClock"]:
                    value=p.get(field)
                    if isinstance(value,str):
                        try:
                            actual=dt(value)
                            if abs((actual-scheduled).total_seconds())<=3600:
                                evidence.append({"play_id":p.get("id"),"field":field,"timestamp":value,"seconds_after_acquisition":round(actual.timestamp()-a["acquired_ms"]/1000,3)})
                        except ValueError: pass
            out["opening_kickoff_wallclock_candidates"]=evidence
            if len(evidence)==1 and evidence[0]["seconds_after_acquisition"]>0: out["status"]="OPENING_PLAY_TIMESTAMP_SUPPORTS_PRE_GAME_ACQUISITION_REVIEW"
    except Exception as e:
        out["status"]="SOURCE_UNAVAILABLE";out["error"]=str(e)
    rows.append(out)
assert len(rows)==9
report={"status":"RESEARCH_ONLY_NO_ADDITIONAL_CREDIT","coverage":dict(Counter(r["status"] for r in rows)),"rows":rows,"limitations":["ESPN scoreboard dates are scheduled times, not actual kickoff.","Opening play wallclock requires independent interpretation; no automatic credit.","Kenyan Drake missing transaction investigated separately."]}
(D/"historical-trade-draft-audits/historical-near-kickoff-independent-review.json").write_text(json.dumps(report,indent=2)+"\n")
print("HISTORICAL NEAR KICKOFF INDEPENDENT REVIEW "+json.dumps(report))
