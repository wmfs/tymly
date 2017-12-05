'use strict'

const _ = require('lodash')
const solr = require('solr-client')
const async = require('async')
const defaultSolrSchemaFields = require('./solr-schema-fields.json')

class Search {
  init (resourceConfig, env, callback) {
    this.searchHistory = env.bootedServices.storage.models['tymly_searchHistory']
    this.client = env.bootedServices.storage.client
    this.services = env.bootedServices
    if (process.env.SOLR_URL) {
      this.solrClient = solr.createClient({
        url: process.env.SOLR_URL,
        core: 'tymly'
      })
    }
    callback(null)
  }

  run (event, context) {
    if (this.services.solr.searchDocs) {
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
    const searchResults = {
      input: filters
    }

    if (process.env.SOLR_URL) {
      const filterQuery = []
      this.searchFields.forEach(s => {
        if (s !== 'modified' && s !== 'created') filterQuery.push(`${s}:${event.query}`)
      })
      const query = `q=*:*&fq=(${filterQuery.join('%20OR%20')})`

      this.solrClient.search(query, (err, result) => {
        if (err) context.sendTaskFailure({error: 'searchFail', cause: err})
        this.constructSearchResults(searchResults, filters, result.response.docs)
        this.updateSearchHistory(searchResults.results, context.userId, (err) => {
          if (err) context.sendTaskFailure({error: 'searchFail', cause: err})
          context.sendTaskSuccess({searchResults})
        })
      })
    } else {
      this.client.query(`select * from tymly.solr_data`, (err, results) => {
        if (err) context.sendTaskFailure({error: 'searchFail', cause: err})
        const matchingDocs = this.filterDocs(results.rows, filters)
        this.constructSearchResults(searchResults, filters, matchingDocs)
        this.updateSearchHistory(searchResults.results, context.userId, (err) => {
          if (err) context.sendTaskFailure({error: 'searchFail', cause: err})
          context.sendTaskSuccess({searchResults})
        })
      })
    }
  }

  constructSearchResults (searchResults, filters, results) {
    searchResults.results = results.slice(filters.offset, (filters.offset + filters.limit))
    searchResults.totalHits = results.length
    searchResults.categoryCounts = this.countCategories(results)
    return searchResults
  }

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
