const { ValidationError } = require('../errors')

function makeQuery ({
  entityName,
  entityNameUc,
  entityNamePlural,
  entityCtl,
  relationsExpression
}) {
  const { formatQuery, formatOrderBy } = openCrudParser(relations.map(r => r.name))

  return {
    [entityName]: async (_, query) => {
      const res = await entityCtl.find(
        formatQuery(query.where),
        { relations: relationsExpression }
      )

      if (!res) throw new ValidationError(`${entityNameUc} not found`)

      return res
    },

    [entityNamePlural]: async (_, query) => entityCtl.findAll(
      formatQuery(query.where),
      {
        orderBy: formatOrderBy(query.orderBy),
        relations: relationsExpression
      })
  }
}
