/* eslint-env mocha */

'use strict'

const pg = require('pg')
const process = require('process')
const pgInfo = require('./../lib')
const chai = require('chai')
const chaiSubset = require('chai-subset')
chai.use(chaiSubset)
const expect = chai.expect
const sqlScriptRunner = require('./fixtures/sql-script-runner')
let client

// Make a Postgres client

describe('Run the basic-usage example', function () {
  this.timeout(15000)

  it('Should create a new pg client', function () {
    console.log('\n\nMAKING NEW PG CLIENT.')
    const pgConnectionString = process.env.PG_CONNECTION_STRING
    console.log('PG_CONNECTION_STRING=' + pgConnectionString)
    client = new pg.Client(pgConnectionString)
    console.log('MADE NEW CLIENT, CONNECTING...')
    client.connect()
    console.log('CONNECTED')
  }
  )

  it('Should install test schemas', function (done) {
    console.log('ABOUT TO INSTALL TEST SCHEMAS...')
    sqlScriptRunner(
        'install-test-schemas.sql',
        client,
        function (err) {
          expect(err).to.equal(null)
          done()
        }
      )
  }
  )

  it('Should get some database info', function (done) {
    pgInfo(
      {
        client: client,
        schemas: ['pginfo_people_test', 'pginfo_planets_test', 'pginfo_not_exists']
      },
        function (err, info) {
          console.log(JSON.stringify(info, null, 2))

          expect(err).to.equal(null)
          expect(info).to.containSubset(
            {
              schemas: {
                'pginfo_people_test': {
                  'schemaExistsInDatabase': true,
                  'comment': 'Simple schema created to support testing of the pg-info package!',
                  'tables': {
                    'people': {
                      'comment': "Isn't this just a list of people?",
                      'pkColumnNames': [
                        'person_no'
                      ],
                      'columns': {
                        'person_no': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': null
                        },
                        'first_name': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': "Person's first name"
                        },
                        'last_name': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': null
                        },
                        'age': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'integer',
                          'characterMaximumLength': null,
                          'numericScale': 0,
                          'comment': 'Age in years'
                        },
                        '_created': {
                          'array': false,
                          'columnDefault': 'now()',
                          'isNullable': 'NO',
                          'dataType': 'timestamp with time zone',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Timestamp for when this record was created'
                        }
                      },
                      'indexes': {
                        'people_age_idx': {
                          'columns': [
                            [
                              'age'
                            ]
                          ],
                          'unique': false,
                          'method': 'btree'
                        },
                        'people_first_name_last_name_idx': {
                          'columns': [
                            [
                              'first_name',
                              'last_name'
                            ]
                          ],
                          'unique': false,
                          'method': 'btree'
                        }
                      },
                      'fkConstraints': {}
                    }
                  }
                },
                'pginfo_planets_test': {
                  'schemaExistsInDatabase': true,
                  'comment': 'Schema containing 3 related tables to support testing of the pg-info package!',
                  'tables': {
                    'planets': {
                      'comment': 'A list of planets',
                      'pkColumnNames': [
                        'name'
                      ],
                      'columns': {
                        'name': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Unique planet name'
                        },
                        'title': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'The display-label of the planet'
                        },
                        'type': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'What type of planet is this?'
                        },
                        'diameter': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'numeric',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'The diameter of the planet, in metres'
                        },
                        'color': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'numeric',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'What color is this planet?'
                        },
                        'tags': {
                          'array': true,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null
                        },
                        'url': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Further reading available here!'
                        },
                        'other_facts': {
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'jsonb',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': null,
                          'array': false
                        },
                        '_created': {
                          'array': false,
                          'columnDefault': 'now()',
                          'isNullable': 'NO',
                          'dataType': 'timestamp with time zone',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Timestamp for when this record was created'
                        }
                      },
                      'indexes': {
                        'other_facts_idx': {
                          'columns': [
                            [
                              'other_facts'
                            ]
                          ],
                          'unique': false,
                          'method': 'gin'
                        }
                      },
                      'fkConstraints': {}
                    },
                    'moons': {
                      'comment': 'Auto-generated via Tableware.js!',
                      'pkColumnNames': [
                        'id'
                      ],
                      'columns': {
                        'id': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'uuid',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Automatically added UUID-based primary key column'
                        },
                        'title': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'The display-label of the moon'
                        },
                        'discovered_by': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Name of the person who discovered the moon'
                        },
                        'discovery_year': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'integer',
                          'characterMaximumLength': null,
                          'numericScale': 0,
                          'comment': 'Year the moon was discovered (e.g. 1804)'
                        },
                        'planet_name': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Auto-added foreign key for planets'
                        },
                        '_created': {
                          'array': false,
                          'columnDefault': 'now()',
                          'isNullable': 'NO',
                          'dataType': 'timestamp with time zone',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Timestamp for when this record was created'
                        }
                      },
                      'indexes': {
                        'moons_planets_name_idx': {
                          'columns': [
                            [
                              'planet_name'
                            ]
                          ],
                          'unique': false,
                          'method': 'btree'
                        }
                      },
                      'fkConstraints': {
                        'moons_to_planets_fk': {
                          'targetTable': 'pginfo_planets_test.planets',
                          'sourceColumns': [
                            'planet_name'
                          ],
                          'targetColumns': [
                            'name'
                          ]
                        }
                      }
                    },
                    'craters': {
                      'comment': 'Auto-generated via Tableware.js!',
                      'pkColumnNames': [
                        'id'
                      ],
                      'columns': {
                        'id': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'uuid',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Automatically added UUID-based primary key column'
                        },
                        'title': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'NO',
                          'dataType': 'text',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'The display-label of the crater'
                        },
                        'diameter': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'integer',
                          'characterMaximumLength': null,
                          'numericScale': 0,
                          'comment': 'Diameter of the crater, in metres'
                        },
                        'moons_id': {
                          'array': false,
                          'columnDefault': null,
                          'isNullable': 'YES',
                          'dataType': 'uuid',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Auto-added foreign key for moons'
                        },
                        '_created': {
                          'array': false,
                          'columnDefault': 'now()',
                          'isNullable': 'NO',
                          'dataType': 'timestamp with time zone',
                          'characterMaximumLength': null,
                          'numericScale': null,
                          'comment': 'Timestamp for when this record was created'
                        }
                      },
                      'indexes': {
                        'craters_moons_id_idx': {
                          'columns': [
                            [
                              'moons_id'
                            ]
                          ],
                          'unique': false,
                          'method': 'btree'
                        }
                      },
                      'fkConstraints': {
                        'craters_to_moons_fk': {
                          'targetTable': 'pginfo_planets_test.moons',
                          'sourceColumns': [
                            'moons_id'
                          ],
                          'targetColumns': [
                            'id'
                          ]
                        }
                      }
                    }
                  }
                },
                'pginfo_not_exists': {
                  'schemaExistsInDatabase': false
                }
              }
            }

          )
          done()
        }
      )
  }
  )

  it('Should uninstall test schemas', function (done) {
    sqlScriptRunner(
        'uninstall-test-schemas.sql',
        client,
        function (err) {
          expect(err).to.equal(null)
          done()
        }
      )
  }
  )

  it('Should end db client', function () {
    client.end()
  }
  )
})
