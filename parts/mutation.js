module.exports = function makeMutation (
  { entityNameUc, entityCtl, relations },
  { createMethod, updateMethod, deleteMethod, openCrudParser, getRelationsExpression }
) {
  const { formatQuery } = openCrudParser(relations.map(r => r.name))
  const relationsExpression = getRelationsExpression(relations)

  return {
    Mutation: {
      [`create${entityNameUc}`]: async (_, { data }) => entityCtl[createMethod](
        data,
        { relations: relationsExpression }
      ),
      [`update${entityNameUc}`]: async (_, { where, data }) => entityCtl[updateMethod](
        formatQuery(where),
        data,
        { relations: relationsExpression }
      ),
      [`delete${entityNameUc}`]: async (_, { id }) => entityCtl[deleteMethod](id)
    }
  }
}
