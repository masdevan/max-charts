# CandlestickChart

Pure JavaScript candlestick chart. Zero dependencies.

---

## Usage

```html
<div id="chart"></div>

<script type="module">
import { CandlestickChart } from './candlestick/candlestick.js'

const chart = new CandlestickChart('#chart', data)
</script>
```

Full page:

```html
<style>
html { width: 100%; height: 100% }
</style>
<div id="chart" style="width:100%;height:100%"></div>
```

Custom size:

```js
const chart = new CandlestickChart('#chart', data, { width: 600, height: 400 })
```

---

## Data format

```js
const data = [
  { symbol: 'BTCUSD', date: '2024-01-02', open: 2063.5, high: 2075.2, low: 2055.8, close: 2070.4 },
  { symbol: 'BTCUSD', date: '2024-01-03', open: 2070.4, high: 2085.0, low: 2065.2, close: 2080.1 }
]
```

Only `date`, `open`, `high`, `low`, `close` are used. `symbol` is optional metadata.

---

## Load from API

```js
fetch('https://api.example.com/ohlc?symbol=XAUUSD&from=2024-01-01&to=2024-06-30')
  .then(r => r.json())
  .then(data => {
    const chart = new CandlestickChart('#chart', data)
    window.chart = chart
  })
```

If your API returns a different format, map it:

```js
fetch('/api/kline')
  .then(r => r.json())
  .then(raw => {
    const data = raw.map(item => ({
      date: item.timestamp,
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c
    }))
    const chart = new CandlestickChart('#chart', data)
  })
```

---

## Update data

```js
chart.setData(newData)
```

Clears and redraws with new data.

---

## Cleanup

```js
chart.destroy()
```

Removes canvas, tooltip, and all event listeners. Use in Electron when component unmounts.

---

## Interactions

| Action | Behavior |
|--------|----------|
| Scroll wheel | Zoom in/out |
| Drag left/right | Pan timeline |
| Hover | Show OHLC tooltip |

---

## File structure

```
candlestick/
├── candlestick.js       # Library
collections/
└── candlestick.json      # Sample data
```
