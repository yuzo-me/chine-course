#!/bin/bash
# Озвучка слов голосом macOS Tingting (временно, до проверки учителем). Выход: content/audio/*.m4a
cd "$(dirname "$0")/../.." || exit 1
mkdir -p content/audio
python3 - <<'PY' | while IFS=$'\t' read -r id hz; do
import json
for w in json.load(open("content/data/hsk1.json",encoding="utf-8"))["words"]: print(w["id"]+"\t"+w["hanzi"])
PY
  [ -f "content/audio/$id.m4a" ] && continue
  say -v Tingting -o "/tmp/$id.aiff" "$hz" && afconvert -f m4af -d aac -b 32000 "/tmp/$id.aiff" "content/audio/$id.m4a" && rm "/tmp/$id.aiff"
done
ls content/audio | wc -l
