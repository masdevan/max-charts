export default {
  async _loadMore(beforeDate) {
    if (this._loading || !this._hasMore || !this._loadFn) return
    this._loading = true
    try {
      const results = await this._loadFn(beforeDate)
      if (!results || results.length === 0) {
        this._hasMore = false
        return
      }
      if (results.length < this._loadLimit) this._hasMore = false

      if (!beforeDate) {
        this._data = results.slice().reverse()
        if (this._decimals == null) this._detectDecimals()
        this._visibleCount = this._defaultVisibleCount()
        this._startIndex = Math.max(0, this._data.length - this._visibleCount)
      } else {
        const added = results.slice().reverse()
        this._startIndex += added.length
        this._dragStartIndex += added.length
        this._data = [...added, ...this._data]
        if (this._decimals == null) this._detectDecimals()
      }

      if (this._data.length > 0) this._loadBeforeDate = this._data[0].date

      this._render()
    } finally {
      this._loading = false
    }
  },

  _checkLoadMore() {
    if (!this._loadFn || this._loading || !this._hasMore) return
    if (this._startIndex < this._loadThreshold) this._loadMore(this._loadBeforeDate)
  }
}
