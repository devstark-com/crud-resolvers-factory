module.exports = {
  objection: (relations, { simple = false } = {}) => {
    if (!relations) return ''

    if (simple) {
      return relations.length === 1
        ? `${relations.map(r => `${r}(selectId)`).join()}`
        : `[${relations.map(r => `${r}(selectId)`).join()}]`
    }

    return relations.length === 1
      ? `${relations.map(r => `${r.name}(selectId)`).join()}`
      : `[${relations.map(r => `${r.name}(selectId)`).join()}]`
  },

  mongoose: (relations, { simple = false } = {}) => {
    if (!relations) return ''

    if (simple) return relations.split(' ').filter(r => !!r).map(r => ({ path: r }))

    return relations.map(r => ({ path: r.name }))
  }
}
