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
| Drag price axis | Stretch price range |
| Hover | Show OHLC tooltip |
| Drag SL/TP label | Move stop-loss / take-profit line |

---

## Trading

Enable trading by clicking the wallet icon in the sidebar. An entry line appears at the last close price with SL (red) and TP (green) labels.

- **SL/TP labels** on the entry line — drag them to separate into individual dashed lines
- **Separated SL/TP lines** — drag vertically to adjust, click `×` to remove
- **Buy / Sell buttons** appear at the top-right of the chart area
- Button state is dynamic: if TP > Entry or SL < Entry → Buy active; if TP < Entry or SL > Entry → Sell active
- Clicking Buy/Sell shows a confirmation modal with entry, SL, and TP prices
- On confirm, `onTrade` callback is invoked

### `onTrade` option

```js
const chart = new CandlestickChart('#chart', {
  load: async (beforeDate) => { /* ... */ },
  onTrade: async (trade) => {
    await fetch('/api/order', { method: 'POST', body: JSON.stringify(trade) })
  }
})
```

The callback receives the trade object and can return a Promise. The modal shows a loading state, then "order placed" on success or the error message on rejection.

---

## Positions

Display position markers on the chart using `chart.setPositions()`:

```js
chart.setPositions([
  {
    "decision": "sell",
    "entry": 4687.5,
    "sl": 4710.0,
    "tp": 4600.0,
    "openTime": "2026-05-11T07:00:00",
    "closeTime": "2026-05-14T14:00:00"
  }
])
```

- `closeTime` null or absent → running position
- Close price is read automatically from candle data at `closeTime`
```

Each position draws:
- Filled circle at the entry candle with price and date labels
- Filled circle at the close candle with price and date labels (closed)
- A diagonal line connecting entry to close, showing P&L direction
- Open positions: diagonal line from entry candle to last candle at current close price

### Custom key mapping

If your API uses different field names, map them via `positionKeys`:

```js
const chart = new CandlestickChart('#chart', {
  positionKeys: {
    decision: 'type',
    entry: 'openPrice',
    sl: 'stopLoss',
    tp: 'takeProfit',
    openTime: 'entryTime',
    closeTime: 'exitTime'
  }
})
```

Trades placed via the Buy/Sell buttons are automatically added as open positions.

```js
const res = await fetch('collections/positions.json')
chart.setPositions(await res.json())
```

---

## File structure

```
candlestick/
├── candlestick.js       # Library
collections/
├── candlestick.json      # Sample data
└── positions.json         # Sample positions
```
