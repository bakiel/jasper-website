#!/bin/bash
# JASPER SEO Quick Launcher for Mac
# Double-click to run, or: ./run_seo.command "keyword"

cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
    KEYWORD=$(osascript -e 'text returned of (display dialog "Enter seed keyword:" default answer "natural hair extensions" buttons {"Cancel", "Research"} default button "Research")' 2>/dev/null)
    [ -z "$KEYWORD" ] && exit 0
else
    KEYWORD="$1"
fi

echo "=============================================="
echo "JASPER SEO Research: $KEYWORD"
echo "=============================================="

pip3 install requests pandas --quiet 2>/dev/null

export SEED_KEYWORD="$KEYWORD"
python3 << 'PYEOF'
import requests, pandas as pd, os
from urllib.parse import quote

def get_suggestions(kw):
    try:
        r = requests.get(f"http://google.com/complete/search?output=toolbar&gl=us&q={quote(kw)}", 
                        timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        return [l.split('"/>')[0].replace('&amp;','&') for l in r.text.split('<suggestion data="')[1:] if '"/>' in l]
    except: return []

def generate(seed, limit=500):
    kws = set()
    for p in ['','how to ','best ','top ','buy ','what is ']:
        kws.update(get_suggestions(f"{p}{seed}")); print(f"\r{len(kws)} keywords", end='')
    for s in [' near me',' online',' price',' review']:
        kws.update(get_suggestions(f"{seed}{s}")); print(f"\r{len(kws)} keywords", end='')
    for c in 'abcdefghijklmnopqrstuvwxyz':
        if len(kws)>=limit: break
        kws.update(get_suggestions(f"{seed} {c}")); print(f"\r{len(kws)} keywords", end='')
    return list(kws)[:limit]

seed = os.environ.get('SEED_KEYWORD','test')
kws = generate(seed)
print(f"\n\nTotal: {len(kws)} keywords")

os.makedirs('seo_outputs', exist_ok=True)
fn = f"seo_outputs/{seed.replace(' ','_')}_keywords.csv"
pd.DataFrame({'keyword':kws}).to_csv(fn, index=False)
print(f"Saved: {fn}\n\nTop 20:")
for i,k in enumerate(kws[:20],1): print(f"  {i}. {k}")
os.system('open seo_outputs')
PYEOF

echo ""
read -p "Press Enter to close..."
