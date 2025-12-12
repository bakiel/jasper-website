#!/bin/bash
# Deploy SEO tools to Hostinger VPS
VPS="root@72.61.201.237"
SCRIPT_DIR="$(dirname "$0")"

echo "Deploying to $VPS..."

ssh -o ConnectTimeout=10 $VPS "bash -s" << 'REMOTE'
mkdir -p /opt/seo-tools
pip3 install requests pandas pytrends --quiet

cat > /opt/seo-tools/research.py << 'PY'
import requests, pandas as pd, sys, os
from urllib.parse import quote

def get_suggestions(kw):
    try:
        r = requests.get(f"http://google.com/complete/search?output=toolbar&gl=us&q={quote(kw)}", timeout=10)
        return [l.split('"/>')[0].replace('&amp;','&') for l in r.text.split('<suggestion data="')[1:] if '"/>' in l]
    except: return []

def generate(seed, limit=500):
    kws = set()
    for p in ['','how to ','best ','top ','buy ']:
        kws.update(get_suggestions(f"{p}{seed}"))
    for c in 'abcdefghijklmnopqrstuvwxyz':
        if len(kws)>=limit: break
        kws.update(get_suggestions(f"{seed} {c}"))
    return list(kws)[:limit]

if __name__=='__main__':
    seed = ' '.join(sys.argv[1:]) or 'test'
    kws = generate(seed)
    os.makedirs('/opt/seo-tools/outputs', exist_ok=True)
    fn = f"/opt/seo-tools/outputs/{seed.replace(' ','_')}_keywords.csv"
    pd.DataFrame({'keyword':kws}).to_csv(fn, index=False)
    print(f"Saved {len(kws)} keywords to {fn}")
PY

chmod +x /opt/seo-tools/research.py
echo "Done! Use: python3 /opt/seo-tools/research.py 'your keyword'"
REMOTE

echo ""
echo "Deployment complete!"
read -p "Press Enter..."
