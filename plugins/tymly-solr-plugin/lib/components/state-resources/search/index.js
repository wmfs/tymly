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

  run (event, context) {
    const solrService = this.services.solr

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
      this.runSolrSearch(event, context, filters)
    } else {
      this.runStorageSearch(context, filters)
    }
  } // run

  runSolrSearch (event, context, filters) {
    const filterQuery = []
    this.searchFields.forEach(s => {
      if (s !== 'modified' && s !== 'created' && s !== 'event_timestamp' && s !== 'point' && s !== 'active_event') filterQuery.push(`${_.camelCase(s)}:${event.query}`)
    })
    const fq = event.query ? `&fq=(${filterQuery.join('%20OR%20')})` : ''
    const query = `q=*:*${fq}&sort=created%20desc`
    console.log(`Solr Query = ${query}`)

    this.solrClient.search(query, (err, result) => {
      if (err) {
        return context.sendTaskFailure({error: 'searchFail', cause: err})
      }
      this.processResults(context, result.response.docs, filters)
    })
  } // runSolrSearch

  runStorageSearch (context, filters) {
    this.storageClient.query(`select * from tymly.solr_data`, (err, results) => {
      if (err) {
        return context.sendTaskFailure({error: 'searchFail', cause: err})
      }
      const matchingDocs = this.filterDocs(results.rows, filters)
      this.processResults(context, matchingDocs, filters)
    })
  } // runStorageSearch

  processResults (context, matchingDocs, filters) {
    const searchResults = {
      input: filters
    }

    this.constructSearchResults(searchResults, filters, matchingDocs)
    this.updateSearchHistory(searchResults.results, context.userId, (err) => {
      if (err) {
        return context.sendTaskFailure({error: 'searchFail', cause: err})
      }
      context.sendTaskSuccess({searchResults})
    })
  } // searchResults

  constructSearchResults (searchResults, filters, results) {
    searchResults.results = this.jsonifyLaunches(results.slice(filters.offset, (filters.offset + filters.limit)))
    searchResults.totalHits = results.length
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
