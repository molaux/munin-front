const { GraphQLServer } = require('graphql-yoga')
var compression = require('compression')
const MuninDB = require('munin-db')
const os = require('os')
const { subDays } = require('date-fns')

var lastLimits = {}

const typeDefs = `
  type Query {
    hostname: String,
    domains: [Domain!]!
    domain(name: String!): Domain
  }
  type Domain {
    name: String!
    hosts: [Host!]!
    host(name: String!): Host
  }
  type Host {
      name: String!
      domain: Domain!
      probes: [Probe!]!
      probesByCategory(category: String!): [Probe!]!
      probe(name: String!): Probe
  }
  type Probe {
      name: String!
      infos: JSON
      targets: [Target!]!
      target(name: String!): Target
  }
  type Target {
      name: String!
      infos: JSON
      state: String
      serie(from: String!, to: String!): [JSON]
  }
  scalar JSON
  scalar DateTime
`
// Object.assign(schema._typeMap.JSON, GraphQLJSON);

const munin = new MuninDB('/var/lib/munin')

const resolvers = {

  Query: {
    hostname: () => os.hostname(),
    domains: () => munin.query().then(data => data.map(name => ({
      name: name
    }))),
    domain: (obj, args) => ({
      name: args.name
    })
  },
  Domain: {
    hosts: (obj) => munin.query(obj.name).then(data => data.map(name => ({
      name: name,
      domain: obj
    }))),
    host: (obj, args) => ({
      name: args.name,
      domain: obj
    })
  },
  Host: {
    probes: (obj) => munin.query(obj.domain.name, obj.name)
      .then(data => data.map(name => ({
        domain: obj.domain.name,
        host: obj.name,
        name: name
      }))),
    probesByCategory: (obj, args) => munin.query(obj.domain.name, obj.name).then(data => data.filter(name => {
      let infos = munin.describe(obj.domain.name, obj.name, name)
      return infos.graph_category !== undefined &&
        infos.graph_category.value &&
        infos.graph_category.value.toLowerCase() === args.category.toLowerCase()
    }).map(name => ({
      domain: obj.domain.name,
      host: obj.name,
      name: name
    }))),
    probe: (obj, args) => ({
      domain: obj.domain.name,
      host: obj.name,
      name: args.name
    })
  },
  Probe: {
    //infos: (obj) => munin.describe(obj.domain, obj.host, obj.name),
    infos: (obj) => ({
	graph_title: { value: '' },
	graph_vlabel: { value: '' },
        graph_category: { value: '' },
        graph_info: { value: '' },
        graph_order: { value: '' },
        ...munin.describe(obj.domain, obj.host, obj.name)
    }),
    targets: (obj) => munin.query(obj.domain, obj.host, obj.name)
      .then(data => data.map(name => ({
        domain: obj.domain,
        host: obj.host,
        probe: obj.name,
        name: name
      }))),
    target: (obj, args) => ({
      domain: obj.domain,
      host: obj.host,
      probe: obj.name,
      name: args.name
    })
  },
  Target: {
    infos: (obj) => ({
	graph_title: { value: '' },
	graph_vlabel: { value: '' },
        graph_category: { value: '' },
        graph_info: { value: '' },
        graph_order: { value: '' },
        ...munin.describe(obj.domain, obj.host, obj.probe, obj.name)
    }),
    state: (obj) => lastLimits[obj.domain] !== undefined
      && lastLimits[obj.domain] !== undefined
      && lastLimits[obj.domain][obj.host] !== undefined
      && lastLimits[obj.domain][obj.host][obj.probe] !== undefined
      && lastLimits[obj.domain][obj.host][obj.probe][obj.name] !== undefined
        ? lastLimits[obj.domain][obj.host][obj.probe][obj.name]
        : 'ok',
    serie: (obj, args) => munin.query(obj.domain, obj.host, obj.probe, obj.name, new Date(args.from), new Date(args.to), null, new Date(args.from) < subDays(new Date(), 2) ? ['MIN', 'MAX', 'AVERAGE'] : ['AVERAGE'])
      .then(data => data.map(timed => ({
          ...timed,
          time: new Date(timed.time * 1000),
        }))
      )
  }
}

const options = { host: '192.168.0.4', port: 4000 }
const server = new GraphQLServer({ typeDefs, resolvers })
server.use(compression())

// Periodically refresh structure and limits
setInterval(() => {
    munin.load()
    munin.limits().then(limits => lastLimits = limits)
  }, 5 * 60 * 1000)

// First load
munin.limits().then(limits => lastLimits = limits)
munin.load().then(() => server.start(options, () => {
  console.log('Server is running on localhost:' + options.port)
}))
