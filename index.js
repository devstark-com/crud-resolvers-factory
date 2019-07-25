const pluralize = require('pluralize')
const upperFirst = require('lodash/upperFirst')
const { UserInputError } = require('apollo-server')

module.exports = function ({
  entityName,
  entityNamePlural,
  entityCtl,
  relations = []
}) {
  const openCrudParser = require('../../libs/opencrud-parser')

  const { formatQuery, formatOrderBy } = openCrudParser(relations.map(r => r.name))
  const entityNameUc = upperFirst(entityName)
  const relationsExpression = getRelationsExpression.mongo(relations)
  const entityNamePluralInner = entityNamePlural || pluralize(entityName)

  const resolvers = {
    Query: {
      [entityName]: async (_, query) => {
        const res = await entityCtl.find(
          formatQuery(query.where),
          { relations: relationsExpression }
        )

        if (!res) throw new UserInputError(`${entityNameUc} not found`)

        return res
      },

      [entityNamePluralInner]: async (_, query) => entityCtl.findAll(
        formatQuery(query.where),
        {
          orderBy: formatOrderBy(query.orderBy),
          relations: relationsExpression
        })
    },

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

    [entityNameUc]: {}
  }

  function oneRelationFactory (relation) {
    const { formatQuery } = openCrudParser(relation.relations)
    const relationsExpression = getRelationsExpression.mongo(relation.relations, { simple: true })

    return async function (parent, query) {
      if (!parent[relation.name]) return null

      const relatedId = parent[relation.name].id

      if (!query.where) query.where = { id_in: [relatedId] }
      else if (!query.where.id_in) query.where.id_in = [relatedId]
      else query.where.id_in.push(relatedId)

      return relation.controller.find(
        formatQuery(query.where),
        { relations: relationsExpression })
    }
  }

  function manyRelationFactory (relation) {
    const { formatQuery, formatOrderBy } = openCrudParser(relation.relations)
    const relationsExpression = getRelationsExpression.mongo(relation.relations, { simple: true })

    return async function (parent, query) {
      if (!parent[relation.name]) return []

      const relatedIds = parent[relation.name].map(c => c.id)

      if (!query.where) query.where = { id_in: relatedIds }
      else if (!query.where.id_in) query.where.id_in = relatedIds
      else query.where.id_in.push(...relatedIds)

      return relation.controller.findAll(
        formatQuery(query.where),
        {
          orderBy: formatOrderBy(query.orderBy),
          relations: relationsExpression
        })
    }
  }

  relations.forEach(r => {
    if (r.type === 'one') resolvers[entityNameUc][r.name] = oneRelationFactory(r)
    if (r.type === 'many') resolvers[entityNameUc][r.name] = manyRelationFactory(r)
    if (!['one', 'many'].includes(r.type)) throw new Error('Invalid relation type')
  })

  return resolvers
}

const getRelationsExpression = {
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

  mongo: (relations, { simple = false } = {}) => {
    if (!relations) return ''

    if (simple) return relations.split(' ').filter(r => !!r).map(r => ({ path: r }))

    return relations.map(r => ({ path: r.name }))
  }
}
