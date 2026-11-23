#!/bin/bash
# Двойной щелчок: запускает сайт на вашем компьютере и открывает его в браузере.
cd "$(dirname "$0")/web" || exit 1
export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null; then echo "Не найден Node.js. Напишите об этом Claude."; read -r; exit 1; fi
(sleep 3; open "http://localhost:5173") &
npm run dev -- --host 127.0.0.1 --port 5173
