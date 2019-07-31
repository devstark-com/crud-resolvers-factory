const upperFirst = require('lodash/upperFirst')
const makeQuery = require('./parts/query')
const makeMutation = require('./parts/mutation')
const relationFactory = require('./parts/relations')
const openCrudParser = require('open-crud-parser')
const relationsExpression = require('./get-relations-expression')

module.exports = function ({ databaseEngine, findOneMethod, findAllMethod, createMethod, updateMethod, deleteMethod }) {
  return function ({
    entityName,
    entityNamePlural,
    entityCtl,
    relations = []
  }, { makeOnly = ['read', 'readAll', 'create', 'update', 'delete'] } = {}) {
    const entityNameUc = upperFirst(entityName)
    const getRelationsExpression = relationsExpression[databaseEngine]

    const resolvers = {
      Query: makeQuery(
        { entityName, entityNameUc, entityCtl, relations },
        { findOneMethod, findAllMethod, openCrudParser, getRelationsExpression },
        { makeOnly }
      ),

      Mutation: makeMutation(
        { entityNameUc, entityCtl, relations },
        { createMethod, updateMethod, deleteMethod, openCrudParser, getRelationsExpression },
        { makeOnly }
      )

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
