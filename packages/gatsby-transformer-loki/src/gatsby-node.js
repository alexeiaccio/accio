const _ = require(`lodash`)
const path = require(`path`)

async function onCreateNode(
  { node, actions, loadNodeContent, createNodeId, createContentDigest },
  pluginOptions
) {
  function getType({ node, object, isArray }) {
    if (pluginOptions && _.isFunction(pluginOptions.typeName)) {
      return pluginOptions.typeName({ node, object, isArray })
    } else if (pluginOptions && _.isString(pluginOptions.typeName)) {
      return pluginOptions.typeName
    } else if (isArray) {
      return _.upperFirst(_.camelCase(`${node.name} Json`))
    } else {
      return _.upperFirst(_.camelCase(`${path.basename(node.dir)} Json`))
    }
  }

  function transformObject(obj, id, type) {
    const lokiNode = {
      ...obj,
      id,
      children: [],
      parent: node.id,
      internal: {
        contentDigest: createContentDigest(obj),
        type,
      },
    }
    createNode(lokiNode)
    createParentChildLink({ parent: node, child: lokiNode })
  }

  const { createNode, createParentChildLink } = actions

  if (node.internal.mediaType !== `application/json`) {
    return
  }

  const content = await loadNodeContent(node)
  const parsedContent = JSON.parse(content)

  if (_.isArray(parsedContent)) {
    parsedContent.forEach((obj, i) => {
      transformObject(
        obj,
        obj.id ? obj.id : createNodeId(`${node.id} [${i}] >>> JSON`),
        getType({ node, object: obj, isArray: true })
      )
    })
  } else if (_.isPlainObject(parsedContent)) {
    transformObject(
      parsedContent,
      parsedContent.id ? parsedContent.id : createNodeId(`${node.id} >>> JSON`),
      getType({ node, object: parsedContent, isArray: false })
    )
  }
}

exports.onCreateNode = onCreateNode