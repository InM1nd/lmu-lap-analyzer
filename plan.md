LMU LAP ANALYZER - ПОЛНЫЙ ПЛАН РАЗРАБОТКИ
Цель: Веб-приложение для анализа кругов Le Mans Ultimate с AI-коучингом на русском языке.

Стек: Next.js 16, TypeScript, Tailwind CSS, DuckDB-WASM, Recharts, Gemini API

ФАЗА 1: PROJECT SETUP & INFRASTRUCTURE (1 час)
1.1 Инициализация проекта
Создай новый Next.js 16 проект с TypeScript и Tailwind CSS:
- npx create-next-app@latest lmu-lap-analyzer --typescript --tailwind --app --no-src-dir
- Настрой app router структуру: app/page.tsx, app/upload/page.tsx, app/analysis/page.tsx
- Добавь базовую навигацию с layout.tsx
- Установи зависимости: @duckdb/duckdb-wasm, recharts, react-dropzone, zustand (state management)
- Настрой Tailwind с dark mode: config добавь темную палитру (zinc/slate)
- Создай компоненты: components/ui/Button.tsx, Card.tsx, Loading.tsx (shadcn/ui стиль)

Требования к структуре:
lmu-lap-analyzer/
├── app/
│   ├── layout.tsx          # Root layout с навигацией
│   ├── page.tsx            # Главная: описание + кнопка "Start"
│   ├── upload/
│   │   └── page.tsx        # Upload интерфейс
│   ├── analysis/
│   │   └── page.tsx        # Dashboard с графиками
│   └── api/
│       ├── parse-duckdb/route.ts
│       └── ai-insights/route.ts
├── components/
│   ├── ui/                 # Переиспользуемые UI компоненты
│   ├── DuckDBUploader.tsx
│   ├── LapComparison.tsx
│   └── AICoach.tsx
├── lib/
│   ├── duckdb.ts           # DuckDB helper functions
│   ├── types.ts            # TypeScript interfaces
│   └── constants.ts        # Track/car configs
└── public/
    └── tracks/             # SVG карты треков


1.2 DuckDB-WASM Setup
Промпт для агента:

Настрой DuckDB-WASM для Next.js 15:

1. Установи: npm install @duckdb/duckdb-wasm

2. В next.config.mjs добавь webpack config:
   - asyncWebAssembly: true
   - Правила для .wasm файлов (type: 'asset/resource')
   - publicPath: '/_next/'

3. Создай lib/duckdb.ts с функциями:
   - initDuckDB(): Promise<AsyncDuckDB> - инициализация с CDN bundles
   - loadDuckDBFile(file: File): Promise<Connection> - загрузка .duckdb
   - queryLaps(conn: Connection): Promise<LapData[]> - SELECT lap_time_ms, sector1_ms, sector2_ms, sector3_ms, position_x, position_y, speed, throttle, brake, gear FROM laps ORDER BY lap_time_ms

4. TypeScript интерфейсы в lib/types.ts:
   interface LapData {
     lap_number: number;
     lap_time_ms: number;
     sector1_ms: number;
     sector2_ms: number;
     sector3_ms: number;
     telemetry: TelemetryPoint[];
   }
   
   interface TelemetryPoint {
     position_normalized: number; // 0-1 по треку
     speed: number;
     throttle: number; // 0-1
     brake: number; // 0-1
     gear: number;
   }

5. Обработка ошибок: try/catch с понятными сообщениями на русском

Валидация: Тестовый .duckdb файл → console.log laps

ФАЗА 2: FILE UPLOAD & DATA PARSING (1.5 часа)
2.1 Upload Interface
Промпт для агента:
Создай компонент components/DuckDBUploader.tsx с react-dropzone:

Функционал:
- Drag-drop зона для .duckdb файлов (LMU telemetry)
- Опционально: CSV upload для reference laps
- Валидация: только .duckdb/.csv, max 50MB
- Progress bar при парсинге
- Preview после загрузки: количество лапов, best lap time, track/car detection

UI требования:
- Tailwind: border-dashed, hover эффекты, темная тема
- Иконки: документ (Heroicons/Lucide)
- После успеха: кнопка "Analyze" → navigate to /analysis

Логика:
- useState для file, loading, error
- onDrop → вызов lib/duckdb.ts loadDuckDBFile()
- Сохранение parsed data в Zustand store (store/lapsStore.ts)
- Автоопределение трека по position_x/y bounds (Bahrain: x ∈ [-500, 500])

Валидация: Upload test.duckdb → видим "5 laps, best 1:14.312, Ferrari 296 GT3, Bahrain"

2.2 Reference Laps Integration
Промпт для агента:
Создай lib/referenceLaps.ts для загрузки hotlaps:

1. Константы в lib/constants.ts:
   export const REFERENCE_LAPS = {
     'bahrain_outer': {
       'ferrari_296_gt3': {
         lap_time_ms: 74102,
         sectors: [22100, 28400, 23602],
         source: 'Track Titan 2025',
         telemetry_url: '/refs/bahrain_ferrari_top.csv'
       }
     },
     'spa': { /* ... */ }
   };

2. Функция loadReferenceLap(track, car):
   - Проверка REFERENCE_LAPS
   - Fetch CSV если есть telemetry_url
   - Parse CSV → TelemetryPoint[] (position_normalized, speed, throttle)
   - Fallback: генерация "идеального" лапа (constant speed по sector times)

3. CSV формат (для manual upload):
   position_normalized,speed,throttle,brake,gear
   0.000,0,0.0,1.0,2
   0.001,45,0.3,0.8,2
   ...

4. UI в app/upload: select track/car → "Load Reference" button

Валидация: Select "Bahrain + Ferrari" → загружается ref lap 1:14.102

ФАЗА 3: DATA VISUALIZATION & COMPARISON (2 часа)
3.1 Lap Comparison Dashboard
Промпт для агента:

Создай components/LapComparison.tsx с Recharts:

Layout (grid 2x2):
1. Speed Trace (top-left):
   - LineChart: X = position_normalized (0-1), Y = speed (km/h)
   - Две линии: your lap (blue), reference (green)
   - Tooltip: позиция, скорость обеих лапов
   
2. Delta Graph (top-right):
   - AreaChart: X = position, Y = time delta (секунды)
   - Цвет: gradient green (gain) → red (loss)
   - Референсная линия Y=0
   
3. Input Traces (bottom-left):
   - ComposedChart: throttle (зелёная линия), brake (красная область)
   - Overlay для your + reference
   
4. Sector Summary Table (bottom-right):
   - Таблица: Sector | Your Time | Ref Time | Delta | %
   - Сортировка по наибольшей потере

Расчёт Delta:
- Нормализовать по position_normalized оба лапа
- Interpolate времена на общие позиции
- delta[i] = ref_time[i] - your_time[i]
- Cumulative delta для графика

Responsive: Tailwind lg:grid-cols-2, md:grid-cols-1
Dark mode: recharts theme customization

Код-пример для Delta calculation:
function calculateDelta(yourLap: TelemetryPoint[], refLap: TelemetryPoint[]) {
  const positions = yourLap.map(p => p.position_normalized);
  const delta = positions.map(pos => {
    const yourTime = interpolate(yourLap, pos, 'time');
    const refTime = interpolate(refLap, pos, 'time');
    return { position: pos, delta: refTime - yourTime };
  });
  return delta;
}

3.2 Track Map Overlay
Промпт для агента:

Создай components/TrackMap.tsx:

1. SVG трассы Bahrain (упрощённый контур):
   - Создай public/tracks/bahrain.svg: простая кривая из position_x/y
   - Viewport: 800x600, path с stroke
   
2. Overlay элементы:
   - Racing line: polyline из telemetry position_x/y
   - Цвет по скорости: heatmap (red < 100 km/h, yellow 100-200, green > 200)
   - Markers: sector splits (S1/S2 end)
   - Tooltip hover: показать speed/throttle в точке
   
3. Интерактив:
   - Click на точку → синхронизация с графиками (position slider)
   - Zoom/pan (react-zoom-pan-pinch или D3)

Для других треков: fallback к простому scatter plot (x/y coordinates)

Валидация: Bahrain map с racing line, красные зоны (торможение), зелёные (прямые)

ФАЗА 4: AI INSIGHTS INTEGRATION (1.5 часа)
4.1 OpenAI API Setup
Промпт для агента:

Создай app/api/ai-insights/route.ts (Next.js Route Handler):

1. Install: npm install openai

2. POST endpoint принимает:
   {
     track: string,
     car: string,
     sectors: { s1: number, s2: number, s3: number }, // delta в секундах
     weakPoints: Array<{
       position: number, // 0-1
       issue: 'throttle_late' | 'brake_early' | 'speed_low',
       delta: number
     }>
   }

3. OpenAI prompt template (в функции generatePrompt):


Ты опытный коуч по сим-рейсингу Le Mans Ultimate.

Данные заезда:

Трек: {track}

Машина: {car}

Дельты по секторам: S1 {s1}s, S2 {s2}s, S3 {s3}s

Проблемные зоны:
{weakPoints.map(p => - Позиция ${Math.round(p.position*100)}%: ${translateIssue(p.issue)}, потеря ${p.delta}s)}

Дай 3 конкретных совета на русском как улучшить время:

Укажи конкретный поворот/зону трассы

Что делать: раньше/позже тормозить, больше газа, другая траектория

Ожидаемый прирост времени

Формат: короткие пункты, технические термины (trail brake, apex, throttle modulation).

4. Response обработка:
- gpt-4o-mini (дешевле)
- max_tokens: 500
- temperature: 0.7
- Parse response → { tips: string[], estimatedGain: number }

5. Error handling: rate limits, API errors → fallback текст


4.2 AI Coach UI Component
Промпт для агента:
Создай components/AICoach.tsx:

UI:
- Card с заголовком "🤖 AI Coach Recommendations"
- Loading state: скелетон или спиннер
- Советы: numbered list с иконками (🎯 для каждого tip)
- "Estimated gain" badge: зелёный если > 0.2s
- Кнопка "Regenerate" для повторного анализа

Логика:
- useEffect при mount → fetch /api/ai-insights с данными из store
- Определение weakPoints из delta data:
  - Найти top 3 зоны с наибольшей потерей
  - Классификация issue по telemetry:
    * throttle_late: если ваш throttle < 0.8 когда ref > 0.9
    * brake_early: если ваш brake > 0.5 когда ref < 0.3
    * speed_low: если speed delta > 10 km/h
    
Интеграция в app/analysis/page.tsx:
- Справа от графиков (1/3 ширины экрана)
- Sticky position при скролле

Пример вывода AI:
1. 🎯 Поворот 4 (позиция 28%): Тормозите на 10м позже (используйте 100m board как ориентир). Trail brake до апекса для ротации Ferrari. Ожидаемый прирост: +0.15s

2. 🎯 Выход из поворота 15 (позиция 94%): Раньше на полный газ — в Ferrari 296 GT3 TC справится. Сейчас теряете 0.2s модуляцией. Прирост: +0.18s

3. 🎯 Сектор 2 общий темп: Несите больше скорости в Поворот 10-11 связке (mid-corner speed). Меньше торможения, плавный arc. Прирост: +0.12s

ФАЗА 5: REFERENCE LAPS DATABASE (1 час)
5.1 Scraper Setup (опционально)
Промпт для агента:

Создай scripts/scrape-references.ts для сбора hotlaps:

1. Puppeteer setup (или Cheerio для статики):
   - Target: tracktitan.io/leaderboards/LeMansUltimate
   - Извлечь: track, car, lap_time, sectors, username
   
2. Сохранение в public/refs/leaderboards.json:
   {
     "bahrain_outer": {
       "ferrari_296_gt3": [
         { "rank": 1, "time": 74102, "sectors": [...], "user": "..." },
         ...
       ]
     }
   }

3. Cron job (опционально):
   - Vercel Cron в vercel.json: daily at 3am
   - Endpoint: app/api/cron/update-refs/route.ts
   
Fallback без scraping:
- Ручной CSV файл в public/refs/ с топ-10 лапов
- Community contributions: GitHub PR для новых рефов

Простой вариант (без scraping):
Создай public/refs/bahrain_ferrari.csv с данными из Reddit:
rank,username,lap_time_ms,s1_ms,s2_ms,s3_ms
1,TopDriver,74102,22100,28400,23602
2,FastGuy,74215,22150,28380,23685
...

В lib/referenceLaps.ts: parse этот CSV при выборе трека

5.2 Track/Car Selection UI
Промпт для агента:
Добавь в app/upload/page.tsx:

1. После upload .duckdb: auto-detect track/car
   - Алгоритм: position bounds, lap time range
   - Bahrain Outer: lap 72-76s, x ∈ [-400, 600]
   - Spa: lap 136-142s, x ∈ [-1000, 1200]
   - Car: из DuckDB metadata или manual select

2. Select меню:
   - Dropdown: все треки из REFERENCE_LAPS
   - Dropdown: все машины для выбранного трека
   - Preview: "Top lap: 1:14.102, your best: 1:14.312, delta: +0.210s"
   
3. "Load Reference" action:
   - Fetch соответствующий CSV
   - Добавить в store как referenceLap
   - Navigate to /analysis

UI: Tailwind custom select или headlessui Listbox, темная тема
ФАЗА 6: POLISH & DEPLOY (1 час)
6.1 Final Touches
Промпт для агента:
Улучшения UX:

1. app/page.tsx (главная):
   - Hero section: "Анализируй свои круги в LMU с AI-коучем"
   - Features grid: 3 карточки (Telemetry, AI Insights, Track Map)
   - CTA: большая кнопка "Начать анализ"
   - Демо скриншот dashboard

2. Loading states:
   - Скелетоны для всех компонентов
   - Progress bar при обработке DuckDB
   - Shimmer эффект

3. Error handling:
   - Toast notifications (sonner или react-hot-toast)
   - Ошибки API: понятные сообщения на русском
   - 404 page с навигацией

4. Accessibility:
   - ARIA labels для всех интерактивных элементов
   - Keyboard navigation (Tab order)
   - Focus states

5. Mobile responsive:
   - Графики: вертикальный стек на < md
   - Upload: полноэкранный на мобильном
   - Таблицы: горизонтальный scroll

6.2 Vercel Deployment
Промпт для агента:

Подготовка к деплою:

1. vercel.json config:
   {
     "buildCommand": "next build",
     "framework": "nextjs",
     "env": {
       "OPENAI_API_KEY": "@openai-key"
     }
   }

2. Оптимизация:
   - next.config.mjs: output 'standalone', compress images
   - Lazy load компонентов: dynamic(() => import(...), { ssr: false })
   - DuckDB WASM: убедиться что .wasm в public/_next/static

3. Environment variables в Vercel dashboard:
   - OPENAI_API_KEY
   - NODE_ENV=production

4. README.md с инструкцией:
   - Как получить .duckdb из LMU (Documents/LeMansUltimate/Telemetry)
   - Включить telemetry в LMU settings
   - Upload файл → выбрать трек/машину → анализ

Deploy команда: vercel --prod

ФАЗА 7: ТЕСТИРОВАНИЕ & ВАЛИДАЦИЯ (30 мин)
7.1 Test Checklist
Промпт для агента:

Создай tests/integration.test.ts (Playwright или Vitest):

Тест-кейсы:
1. ✅ Upload .duckdb файл → парсинг успешен
2. ✅ Auto-detect Bahrain Ferrari → правильные константы
3. ✅ Load reference lap → delta расчёт корректен
4. ✅ Графики рендерятся без ошибок
5. ✅ AI API возвращает 3 совета
6. ✅ Mobile viewport: всё видно
7. ✅ Dark mode: цвета контрастные

Manual testing:
- Твой реальный .duckdb с Bahrain 1:14.3
- Проверка советов AI: релевантны ли для Ferrari/Bahrain?
- Cross-browser: Chrome, Firefox, Safari

7.2 Performance Check
Checklist:

Lighthouse score > 90 (performance, accessibility)

DuckDB parsing < 2s для файла 10MB

First paint < 1.5s

Bundle size < 500KB (gzip)

ИТОГОВАЯ СТРУКТУРА ФАЙЛОВ
lmu-lap-analyzer/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Landing
│   ├── upload/
│   │   └── page.tsx                  # Upload + track/car select
│   ├── analysis/
│   │   └── page.tsx                  # Dashboard с графиками + AI
│   └── api/
│       ├── parse-duckdb/route.ts
│       └── ai-insights/route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Loading.tsx
│   ├── DuckDBUploader.tsx
│   ├── LapComparison.tsx            # Все 4 графика
│   ├── TrackMap.tsx
│   └── AICoach.tsx
├── lib/
│   ├── duckdb.ts                    # DuckDB helpers
│   ├── referenceLaps.ts             # Load refs
│   ├── types.ts                     # Interfaces
│   └── constants.ts                 # Track/car data
├── store/
│   └── lapsStore.ts                 # Zustand
├── public/
│   ├── tracks/
│   │   └── bahrain.svg
│   └── refs/
│       ├── leaderboards.json
│       └── bahrain_ferrari.csv
├── scripts/
│   └── scrape-references.ts         # Опционально
├── .env.local
├── next.config.mjs
├── tailwind.config.ts
└── README.md


КЛЮЧЕВЫЕ ТЕХНИЧЕСКИЕ ДЕТАЛИ
DuckDB Query Example
// lib/duckdb.ts
export async function queryLaps(conn: Connection) {
  const result = await conn.query(`
    SELECT 
      lap_number,
      lap_time_ms,
      sector1_ms,
      sector2_ms, 
      sector3_ms,
      position_x,
      position_y,
      speed,
      throttle,
      brake,
      gear,
      timestamp
    FROM laps 
    WHERE lap_time_ms > 0 
      AND lap_time_ms < 200000
    ORDER BY lap_time_ms ASC
  `);
  return result.toArray();
}

AI Prompt Final Version
const prompt = `Ты профессиональный коуч Le Mans Ultimate GT3.

Анализ заезда:
Трек: ${track}
Машина: ${car}
Лучший круг: ${formatTime(yourBestLap)}
Референс: ${formatTime(refBestLap)}
Общая потеря: ${formatTime(totalDelta)}

Дельты по секторам:
- S1: ${formatDelta(sectors.s1)}
- S2: ${formatDelta(sectors.s2)}
- S3: ${formatDelta(sectors.s3)}

Слабые зоны (по телеметрии):
${weakPoints.map((p, i) => `${i+1}. Позиция ${Math.round(p.position*100)}% трека: ${p.description}, потеря ${formatTime(p.delta)}`).join('\n')}

Задача: Дай 3 конкретных технических совета на русском:
- Укажи номер/название поворота если знаешь трассу
- Конкретное действие (раньше тормозить, позже газ, другая линия)
- Специфика машины (для Ferrari 296 GT3: mid-engine rotation, TC settings)
- Реалистичный прирост времени

Формат ответа (JSON):
{
  "tips": [
    "🎯 Поворот X: [совет]. Прирост: +0.XXs",
    ...
  ],
  "totalEstimatedGain": 0.XX
}`;

Delta Calculation Algorithm
function calculatePositionDelta(
  yourLap: TelemetryPoint[],
  refLap: TelemetryPoint[]
): DeltaPoint[] {
  // Normalize positions to 0-1
  const normalize = (points: TelemetryPoint[]) => {
    const totalDist = points[points.length - 1].distance;
    return points.map(p => ({
      ...p,
      position: p.distance / totalDist
    }));
  };
  
  const yourNorm = normalize(yourLap);
  const refNorm = normalize(refLap);
  
  // Interpolate to common positions
  const positions = Array.from({length: 1000}, (_, i) => i / 1000);
  
  return positions.map(pos => {
    const yourTime = interpolateTime(yourNorm, pos);
    const refTime = interpolateTime(refNorm, pos);
    
    return {
      position: pos,
      delta: yourTime - refTime, // Positive = you're slower
      speed: interpolateValue(yourNorm, pos, 'speed'),
      throttle: interpolateValue(yourNorm, pos, 'throttle')
    };
  });
}
