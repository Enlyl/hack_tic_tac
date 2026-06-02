# hack_tic_tac // Hacker vs Corporation

Стилизованные крестики-нолики в эстетике hacker vs corporation.
Vanilla HTML/CSS/JS — без сборщиков, без зависимостей.

## Запуск

Просто открой `index.html` в браузере, либо подними локальный сервер:

```powershell
# из корня проекта
python -m http.server 8000
# или
npx serve .
```

Затем открой `http://localhost:8000`.

> **Важно:** Web Audio API и некоторые шрифты Google Fonts требуют открытия через `http://` (не `file://`). Локальный сервер рекомендуется.

## Фичи

- **Режимы**: `VS_AI` (Easy / Hard minimax) и `VS_HUMAN` (hot-seat)
- **Языки**: EN / RU — переключатель в правом верхнем углу
- **Счёт**: Hacker / Corp / Draws, сохраняется в `localStorage`
- **Звук**: всё синтезируется через Web Audio API (никаких mp3)
- **Фон**: matrix-rain на canvas
- **Эффекты**: scanlines, CRT-flicker, RGB-глитч, неон, анимированная линия победы
- **Управление**:
  - Клик по клетке — ход
  - `R` — сброс
  - `Y` — играть снова (когда оверлей активен)
  - Konami-код: `↑↑↓↓←→←→BA` → радужный режим

## Структура

```
test_01/
├── index.html
├── css/style.css
├── js/game.js
└── README.md
```

## Терминология

| EN | RU | Смысл |
|---|---|---|
| `HACKER` | `ХАКЕР` | Игрок X |
| `CORP` | `КОРП.` | Игрок O / AI |
| `[INJECT]` | `[ВНЕДРЕНИЕ]` | Символ хакера |
| `[FIREWALL]` | `[ФАЕРВОЛ]` | Символ корпорации |
| `ROOT_ACCESS_GRANTED` | `ДОСТУП_ПОЛУЧЕН` | Победа хакера |
| `SYSTEM_PWNED` | `СИСТЕМА_ВЗЛОМАНА` | Победа корпорации |

---

`> HACK_TIC_TAC // NEON_GRID :: BUILD_2026.06`
