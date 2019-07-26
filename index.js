const upperFirst = require('lodash/upperFirst')
const makeQuery = require('./parts/query')
const relationFactory = require('./parts/relations')
const openCrudParser = require('open-crud-parser')
const relationsExpression = require('./get-relations-expression')

module.exports = function ({ databaseEngine, findOneMethod, findAllMethod }) {
  return function ({
    entityName,
    entityNamePlural,
    entityCtl,
    relations = []
  }) {
    const entityNameUc = upperFirst(entityName)
    const getRelationsExpression = relationsExpression[databaseEngine]

    const resolvers = {
      Query: makeQuery(
        { entityName, entityNameUc, entityCtl, relations },
        { findOneMethod, findAllMethod, openCrudParser, getRelationsExpression }
      )

      // Mutation: {
      //   [`add${entityNameUc}`]: async (_, { data }) => entityCtl.create(
      //     data,
      //     { relations: relationsExpression }
      //   ),
      //   [`update${entityNameUc}`]: async (_, { where, data }) => entityCtl.update(
      //     formatQuery(where),
      //     data,
      //     { relations: relationsExpression }
      //   ),
      //   [`remove${entityNameUc}`]: async (_, { id }) => entityCtl.delete(id)
      // },
    }

    if (relations.length) resolvers[entityNameUc] = {}
    else return resolvers

    relations.forEach(r => {
      if (r.type === 'one') {
        resolvers[entityNameUc][r.name] = relationFactory({
          findOneMethod,
          findAllMethod,
          openCrudParser,
          getRelationsExpression
        })
          .oneRelationFactory(r)
      }
      if (r.type === 'many') {
        resolvers[entityNameUc][r.name] = relationFactory({
          findOneMethod,
          findAllMethod,
          openCrudParser,
          getRelationsExpression
        })
          .manyRelationFactory(r)
      }
      if (!['one', 'many'].includes(r.type)) throw new Error('Invalid relation type')
    })

    return resolvers
  }
}
