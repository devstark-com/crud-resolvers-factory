const pluralize = require('pluralize')
const { ValidationError } = require('../errors')

module.exports = function makeQuery (
  { entityName, entityNameUc, entityNamePlural, entityCtl, relations },
  { findOneMethod, findAllMethod, countMethod, openCrudParser, getRelationsExpression },
  { makeOnly }
) {
  const { formatQuery, formatOrderBy } = openCrudParser(relations.map(r => r.name))
  const relationsExpression = getRelationsExpression(relations)
  const entityNamePluralInner = entityNamePlural || pluralize(entityName)

  const queries = {}

  if (makeOnly.includes('read')) {
    queries[entityName] = async (_, query) => {
      if (Object.keys(query.where).length < 1) throw new ValidationError(`WhereUniqueInput should not be empty`)

      const res = await entityCtl[findOneMethod](
        formatQuery(query.where),
        { relations: relationsExpression }
      )

      if (!res) throw new ValidationError(`${entityNameUc} not found`)

      return res
    }
  }

  if (makeOnly.includes('readAll')) {
    queries[entityNamePluralInner] = async (_, query) => {
      const formatedQuery = formatQuery(query.where)
      return {
        totalCount: entityCtl[countMethod](formatedQuery),
        list: entityCtl[findAllMethod](
          formatedQuery,
          {
            orderBy: formatOrderBy(query.orderBy),
            skip: query.skip,
            limit: query.limit,
            relations: relationsExpression
          })
      }
    }
  }

  return queries
}
