module.exports = function makeMutation (
  { entityNameUc, entityCtl, relations },
  { createMethod, updateMethod, deleteMethod, openCrudParser, getRelationsExpression },
  { makeOnly }
) {
  const relationsExpression = getRelationsExpression(relations)

  const mutations = {}

  if (makeOnly.includes('create')) {
    mutations[`create${entityNameUc}`] = async (_, { data }) => entityCtl[createMethod](
      data,
      { relations: relationsExpression }
    )
  }

  if (makeOnly.includes('update')) {
    mutations[`update${entityNameUc}`] = async (_, { where, data }) => entityCtl[updateMethod](
      Object.values(where)[0],
      data,
      { relations: relationsExpression }
    )
  }

  if (makeOnly.includes('delete')) {
    mutations[`delete${entityNameUc}`] = async (_, { id }) => entityCtl[deleteMethod](id)
  }

  return mutations
}
