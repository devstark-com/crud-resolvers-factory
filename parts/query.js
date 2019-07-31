const pluralize = require('pluralize')
const { ValidationError } = require('../errors')

module.exports = function makeQuery (
  { entityName, entityNameUc, entityNamePlural, entityCtl, relations },
  { findOneMethod, findAllMethod, openCrudParser, getRelationsExpression },
  { makeOnly }
) {
  const { formatQuery, formatOrderBy } = openCrudParser(relations.map(r => r.name))
  const relationsExpression = getRelationsExpression(relations)
  const entityNamePluralInner = entityNamePlural || pluralize(entityName)

  const queries = {}

  if (makeOnly.includes('read')) {
    queries[entityName] = async (_, query) => {
      const res = await entityCtl[findOneMethod](
        formatQuery(query.where),
        { relations: relationsExpression }
      )

      if (!res) throw new ValidationError(`${entityNameUc} not found`)

      return res
    }
  }

  if (makeOnly.includes('readAll')) {
    queries[entityNamePluralInner] = async (_, query) => entityCtl[findAllMethod](
      formatQuery(query.where),
      {
        orderBy: formatOrderBy(query.orderBy),
        relations: relationsExpression
      })
  }

  return queries
}
