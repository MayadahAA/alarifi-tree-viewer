#!/bin/bash
# شغّل الشجرة محليًا: اضغط عليه مرتين
cd "$(dirname "$0")" || exit 1
PORT=8787
command -v python3 >/dev/null 2>&1 || { echo "python3 غير موجود. ثبّت أدوات Xcode: xcode-select --install"; read -r; exit 1; }
echo "الشجرة على http://localhost:$PORT"
( sleep 1; open "http://localhost:$PORT/index.html" ) &
python3 -m http.server "$PORT"
