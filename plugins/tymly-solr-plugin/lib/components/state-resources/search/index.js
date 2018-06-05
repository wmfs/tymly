'use strict'

const _ = require('lodash')
const solr = require('solr-client')
const async = require('async')
const defaultSolrSchemaFields = require('./solr-schema-fields.json')

class Search {
  init (resourceConfig, env, callback) {
    this.searchHistory = env.bootedServices.storage.models['tymly_searchHistory']
    this.storageClient = env.bootedServices.storage.client
    this.services = env.bootedServices
    callback(null)
  }

  get solrClient () {
    if (this.solrClient_) {
      return this.solrClient_
    }

    const solrConnection = this.services.solr.solrConnection
    this.solrClient_ = solr.createClient({
      host: solrConnection.host,
      port: solrConnection.port,
      path: solrConnection.path,
      core: 'tymly'
    })

    return this.solrClient_
  } // solrClient

  async run (event, context) {
    const rbacService = this.services.rbac
    const solrService = this.services.solr

    if (!context.userId) {
      return context.sendTaskFailure({
        error: 'noUserIdSearchFail',
        cause: 'No user ID found when trying to search.'
      })
    } // if ...

    try {
      const userRoles = await rbacService.getUserRoles(context.userId)

      if (!userRoles.includes('$authenticated')) userRoles.push('$authenticated')

      if (solrService.searchDocs) {
        const searchDocs = this.services.solr.searchDocs
        this.searchFields = new Set()
        Object.keys(searchDocs).map(s => {
          Object.keys(searchDocs[s].attributeMapping).map(a => {
            this.searchFields.add(_.snakeCase(a))
          })
        })
      } else {
        this.searchFields = defaultSolrSchemaFields
      }

      const filters = this.processFilters(event)

      if (solrService.solrUrl) {
        this.runSolrSearch(event, context, filters, userRoles)
      } else {
        this.runStorageSearch(context, filters, userRoles)
      }
    } catch (err) {
      context.sendTaskFailure({error: 'searchGettingUserRolesFail', cause: err})
    }
  } // run

  runSolrSearch (event, context, filters, userRoles) {
    const searchTerm = event.query ? `(${event.query.trim().replace(/,/g, '').split(' ').filter(x => x).join(' AND ').replace(/ /g, '%20')})` : ''

    const filterQuery = []
    this.searchFields.forEach(s => {
      if (
        s !== 'modified' &&
        s !== 'created' &&
        s !== 'event_timestamp' &&
        s !== 'point' &&
        s !== 'active_event' &&
        s !== 'category'
      ) {
        filterQuery.push(`${_.camelCase(s)}:${searchTerm}`)
      }
    })
    const fq = searchTerm ? `&fq=(${filterQuery.join('%20OR%20')})` : ''
    const categoryQuery = event.categoryRestriction && event.categoryRestriction.length > 0 ? `%20AND%20category:(${event.categoryRestriction.join('%20OR%20')})` : ''
    const userRolesQuery = `%20AND%20roles:(${userRoles.map(r => r).join('%20OR%20')})`
    const activeEvent = filters.showActiveEventsOnly ? `%20AND%20activeEvent:true` : ``
    const query = `q=*:*${userRolesQuery}${categoryQuery}${activeEvent}${fq}&sort=created%20desc&start=${event.offset}&rows=${event.limit}`
    console.log(`Solr Query = ${query}`)

    this.solrClient.search(query, (err, result) => {
      if (err) {
        return context.sendTaskFailure({error: 'searchFail', cause: err})
      }
      this.processResults(context, result.response.docs, filters, result.response.numFound)
    })
  } // runSolrSearch

  runStorageSearch (context, filters, userRoles) {
    const where = userRoles.map(role => `'${role}' = any(roles)`)
    const query = `select * from tymly.solr_data` + (where.length > 0 ? ` where ${where.join(' or ')}` : ``)

    this.storageClient.query(query, (err, results) => {
      if (err) {
        return context.sendTaskFailure({error: 'searchFail', cause: err})
      }
      const matchingDocs = this.filterDocs(results.rows, filters)
      this.processResults(context, matchingDocs, filters, matchingDocs.length)
    })
  } // runStorageSearch

  processResults (context, matchingDocs, filters, totalHits) {
    const searchResults = {
      input: filters,
      totalHits: totalHits
    }

    this.constructSearchResults(searchResults, filters, matchingDocs)
    this.updateSearchHistory(searchResults.results, context.userId, err => {
      if (err) return context.sendTaskFailure({error: 'searchFail', cause: err})
      else return context.sendTaskSuccess({searchResults})
    })
  } // searchResults

  constructSearchResults (searchResults, filters, results) {
    searchResults.results = this.jsonifyLaunches(results)
    searchResults.categoryCounts = this.countCategories(results)
    return searchResults
  }

  jsonifyLaunches (results) {
    const withJson = results.map(r => {
      if (r.launches) {
        try {
          // try to parse JSON
          const launches = JSON.parse(r.launches)
          if (launches.launches) {
            r.launches = launches.launches
          }
        } catch (e) {
          // do nothing
        }
      }
      return r
    })
    return withJson
  } // jsonifyLaunches

  updateSearchHistory (docs, userId, callback) {
    async.eachSeries(
      docs,
      (r, cb) => {
        this.searchHistory.upsert(
          {
            userId: userId || 'n/a',
            docId: r.doc_id,
            category: r.category
          },
          {},
          (err) => {
            cb(err)
          }
        )
      },
      (err) => {
        callback(err)
      }
    )
  }

  countCategories (docs) {
    const facets = {}
    docs.map(doc => {
      if (!facets.hasOwnProperty(doc.category)) {
        facets[doc.category] = 1
      } else {
        facets[doc.category]++
      }
    })
    return facets
  }

  filterDocs (docs, filters) {
    const matchingDocs = []
    docs.map(candidate => {
      if (
        this.domainMatch(filters.domain, candidate) &&
        this.categoryMatch(filters.categoryRestriction, candidate) &&
        this.activeEventMatch(filters.showActiveEventsOnly, candidate) &&
        this.queryMatch(filters.query, candidate)) {
        matchingDocs.push(candidate)
      }
    })
    return matchingDocs
  }

  queryMatch (query, doc) {
    let match = false
    if (_.isUndefined(query)) {
      match = true
    } else {
      this.searchFields.forEach(s => {
        if (s !== 'created' && s !== 'modified') {
          if (doc[s] && doc[s].toString().toUpperCase().includes(query.toUpperCase())) match = true
        }
      })
    }
    return match
  }

  categoryMatch (categoryRestriction, doc) {
    if (categoryRestriction.length === 0) {
      return true
    } else {
      return categoryRestriction.indexOf(doc.category) !== -1
    }
  }

  domainMatch (domain, doc) {
    if (!domain) {
      return true
    } else {
      return domain === doc.domain
    }
  }

  activeEventMatch (showActiveEventsOnly, doc) {
    if (!showActiveEventsOnly) {
      return true
    } else {
      return doc.activeEvent
    }
  }

  processFilters (event) {
    const searchDefaults = {
      orderBy: 'relevance',
      offset: 0,
      limit: 10,
      categoryRestriction: [],
      showActiveEventsOnly: false
    }
    const filters = {}
    if (_.isString(event.domain)) {
      filters.domain = event.domain
    }

    if (_.isString(event.query) && event.query.trim() !== '') {
      filters.query = event.query
    }

    if (_.isString(event.orderBy)) {
      filters.orderBy = event.orderBy
    } else {
      filters.orderBy = searchDefaults.orderBy
    }

    if (_.isInteger(event.offset)) {
      filters.offset = event.offset
    } else {
      filters.offset = searchDefaults.offset
    }

    if (_.isInteger(event.offset)) {
      filters.limit = event.limit
    } else {
      filters.limit = searchDefaults.limit
    }

    if (_.isNumber(event.lat) && _.isNumber(event.long)) {
      filters.lat = event.lat
      filters.long = event.long
    }

    if (_.isArray(event.categoryRestriction)) {
      filters.categoryRestriction = event.categoryRestriction
    } else {
      filters.categoryRestriction = searchDefaults.categoryRestriction
    }

    if (_.isBoolean(event.showActiveEventsOnly)) {
      filters.showActiveEventsOnly = event.showActiveEventsOnly
    } else {
      filters.showActiveEventsOnly = searchDefaults.showActiveEventsOnly
    }

    return filters
  }
}

module.exports = Search
