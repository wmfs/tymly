const chalk = require('chalk')

class Logger {
  title (text) {
    console.log(chalk.bold(chalk.underline(chalk.cyan(text))))
    console.log('')
  }
  section (text) {
    console.log('')
    console.log('  ' + chalk.blue(text))
  }
  success (text) {
    console.log(`    ${chalk.green('SUCCESS')} ${text}`)
  }
  failed (text) {
    console.log(`    ${chalk.red('FAILED')} ${text}`)
  }

  comment (text) {
    console.log(`    ${chalk.gray('//')} ${chalk.gray(text)}`)
  }
}

module.exports = new Logger()
