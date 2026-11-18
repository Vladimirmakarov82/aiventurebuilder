#!/bin/sh
# Build and lint RU copy. Fails on any hard error.
set -e
cd "$(dirname "$0")"
python3 build.py
python3 - <<'P'
import re,json
s=open('site/ru/index.html').read()
m=re.search(r'window.__CF=(.*?);window.__POOL=(.*?);window.__TF=(.*?);</script>',s,re.S)
out=[]
def walk(x):
  if isinstance(x,str): out.append(x)
  elif isinstance(x,list): [walk(i) for i in x]
  elif isinstance(x,dict): [walk(v) for v in x.values()]
for g in m.groups(): walk(json.loads(g))
open('/tmp/ru_js.txt','w').write('\n'.join(re.sub('<[^>]+>','',t) for t in out))
P
python3 ru_lint.py site/ru/index.html /tmp/ru_js.txt
