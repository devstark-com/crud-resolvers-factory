module.exports = function relationsFactory ({ findOneMethod, findAllMethod, openCrudParser, getRelationsExpression }) {
  return {
    oneRelationFactory (relation) {
      const { formatQuery } = openCrudParser(relation.relations)
      const relationsExpression = getRelationsExpression(relation.relations, { simple: true })

      return async function (parent, query) {
        if (!parent[relation.name]) return null

        const relatedId = parent[relation.name].id

        if (!query.where) query.where = { id_in: [relatedId] }
        else if (!query.where.id_in) query.where.id_in = [relatedId]
        else query.where.id_in.push(relatedId)

        return relation.controller[findOneMethod](
          formatQuery(query.where),
          { relations: relationsExpression })
      }
    },

    manyRelationFactory (relation) {
      const { formatQuery, formatOrderBy } = openCrudParser(relation.relations)
      const relationsExpression = getRelationsExpression(relation.relations, { simple: true })

      return async function (parent, query) {
        if (!parent[relation.name]) return []

        const relatedIds = parent[relation.name].map(c => c.id)

        if (!query.where) query.where = { id_in: relatedIds }
        else if (!query.where.id_in) query.where.id_in = relatedIds
        else query.where.id_in.push(...relatedIds)

        return relation.controller[findAllMethod](
          formatQuery(query.where),
          {
            orderBy: formatOrderBy(query.orderBy),
            relations: relationsExpression
          })
      }
    }
  }
}
