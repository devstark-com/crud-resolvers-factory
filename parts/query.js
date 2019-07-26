const pluralize = require('pluralize')
const { ValidationError } = require('../errors')

module.exports = function makeQuery (
  { entityName, entityNameUc, entityNamePlural, entityCtl, relations },
  { findOneMethod, findAllMethod, openCrudParser, getRelationsExpression }
) {
  const { formatQuery, formatOrderBy } = openCrudParser(relations.map(r => r.name))
  const relationsExpression = getRelationsExpression(relations)
  const entityNamePluralInner = entityNamePlural || pluralize(entityName)

  return {
    [entityName]: async (_, query) => {
      const res = await entityCtl[findOneMethod](
        formatQuery(query.where),
        { relations: relationsExpression }
      )

      if (!res) throw new ValidationError(`${entityNameUc} not found`)

      return res
    },

    [entityNamePluralInner]: async (_, query) => entityCtl[findAllMethod](
      formatQuery(query.where),
      {
        orderBy: formatOrderBy(query.orderBy),
        relations: relationsExpression
      })
  }
}
