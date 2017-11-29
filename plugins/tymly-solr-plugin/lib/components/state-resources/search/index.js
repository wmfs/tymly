'use strict'

const _ = require('lodash')
const solr = require('solr-client')
const async = require('async')

class Search {
  init (resourceConfig, env, callback) {
    this.client = env.bootedServices.storage.client
    this.services = env.bootedServices
    if (process.env.SOLR_URL) {
      this.solrClient = solr.createClient({
        url: process.env.SOLR_URL,
        core: 'tymly_new'
      })
    }
    callback(null)
  }

  run (event, context) {
    const searchDocs = this.services.solr.searchDocs || []
    this.searchFields = new Set()
    Object.keys(searchDocs).map(s => {
      Object.keys(searchDocs[s].attributeMapping).map(a => {
        this.searchFields.add(_.snakeCase(a))
      })
    })

    this.client.query(`select * from tymly.solr_data`, (err, results) => {
      if (err) context.sendTaskFailure({error: 'searchFail', cause: err})

      const filters = this.processFilters(event)
      const searchResults = {
        input: filters
      }
      this.filterDocs(results.rows, filters, (err, matchingDocs) => {
        if (err) context.sendTaskFailure({error: 'searchFail', cause: err})

        searchResults.totalHits = matchingDocs.length
        // if (filters.orderBy) this.orderDocsByRelevance(matchingDocs)
        searchResults.categoryCounts = this.countCategories(matchingDocs)
        searchResults.results = matchingDocs.slice(filters.offset, (filters.offset + filters.limit))
        context.sendTaskSuccess({searchResults})
      })
    })
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

  filterDocs (docs, filters, callback) {
    const matchingDocs = []
    async.eachSeries(
      docs,
      (candidate, cb) => {
        this.queryMatch(filters.query, candidate, (err, match) => {
          if (err) cb(err)

          if (
            this.domainMatch(filters.domain, candidate) &&
            this.categoryMatch(filters.categoryRestriction, candidate) &&
            this.activeEventMatch(filters.showActiveEventsOnly, candidate) &&
            match) {
            matchingDocs.push(candidate)
          }
          cb()
        })
      },
      (err) => {
        callback(err, matchingDocs)
      }
    )
  }

  queryMatch (query, doc, callback) {
    let match = false
    if (_.isUndefined(query)) {
      callback(null, true)
    } else {
      if (!process.env.SOLR_URL) {
        this.searchFields.forEach(s => {
          if (s !== 'created' && s !== 'modified') {
            if (doc[s] && doc[s].toString().toUpperCase().includes(query.toUpperCase())) match = true
          }
        })
        callback(null, match)
      } else {
        const q = this.solrClient.createQuery().q({'collector': query})
        this.solrClient.search(q, (err, result) => {
          const contains = result.response.docs.filter(r => r.id === doc.id)
          if (contains.length > 0) match = true
          callback(err, match)
        })
      }
    }
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
