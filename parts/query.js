const Query = {
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
}