# CRUDGQL

This library generates CRUD resolvers for apollo server from configuration. (Example configuration given below)
Currently mutation methods are not supported. They will be included soon.

`crudgql` uses https://github.com/devstark-com/open-crud-parser.
So it can be used with queries builded by openCRUD standard.
Standard can be found here: https://www.opencrud.org/

## Usage

```js
const resolversFactory = require('crud-resolvers-factory')({
  databaseEngine: 'objection', // enum['objection'|'mongo']
  findAllMethod: 'findAll', // method to findAll entities in your data manipulator module
  findOneMethod: 'find' // method to findOne entities in your data manipulator module
})

const resolvers = resolversFactory({
  entityName: 'movie',

  // controller should contain `findAllMethod` and `FindOneMethod` specified above
  entityCtl: require('./path/to/movie/controller'),

  // entity relations
  relations: [{
    name: 'actors', // name of relation must be specified as it specified in parent model
    controller: require('./path/to/actor/controller'),
    type: 'many', // type of relation relative to parent(e.g. movie --one to many-- actors)
    relations: ['roles'] // relations of relation. Here you must specify only it`s names as specified in parent model(here parent model is `actor`)
  }, {
    name: 'franchise',
    controller: require('./path/to/franchise/controller'),
    type: 'one',
    relations: ['lordOfTheRings', 'HP', 'starWars']
  }]
})
```

this will produce the following resolvers

```js
resolvers == {
  Query: {
    movie: async (_, query) => {
      const res = await entityCtl[findOneMethod](
        formatQuery(query.where), // method from https://github.com/devstark-com/open-crud-parser
        { relations: relationsExpression } // relationsExpression - specific to your databaseEngine
        // examples
        // mongo: [{ path: 'actors' }, { path: 'franchise' }]
        // objection: '[actors(selectId), franchise(selectId)]' or for one relation 'actors(selectId)'
      )

      if (!res) throw new ValidationError(`${entityNameUc} not found`)

      return res
    },

    movies: async (_, query) => entityCtl[findAllMethod](
      formatQuery(query.where),
      {
        orderBy: formatOrderBy(query.orderBy), // method from https://github.com/devstark-com/open-crud-parser
        relations: relationsExpression
      })
  },

  Movie: {
    actors: async function (parent, query) {
      if (!parent[relation.name]) return []

      const relatedIds = parent[relation.name].map(c => c.id)

      if (!query.where) query.where = { id_in: relatedIds } // id_in query parameter specific to OpenCRUD
      else if (!query.where.id_in) query.where.id_in = relatedIds
      else query.where.id_in.push(...relatedIds)

      return relation.controller[findAllMethod](
        formatQuery(query.where),
        {
          orderBy: formatOrderBy(query.orderBy),
          relations: relationsExpression
        })
    },

    franchise: async function (parent, query) {
      if (!parent[relation.name]) return null

      const relatedId = parent[relation.name].id

      if (!query.where) query.where = { id_in: [relatedId] }
      else if (!query.where.id_in) query.where.id_in = [relatedId]
      else query.where.id_in.push(relatedId)

      return relation.controller[findOneMethod](
        formatQuery(query.where),
        { relations: relationsExpression })
    },
  }
}
```