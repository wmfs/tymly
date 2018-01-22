node {
   stage('Prepare') {
     git url: 'https://github.com/wmfs/tymly'
   }
   stage('Build') {
      sh "./gradlew ci_test"
   }
   stage('Results') {
      junit 'build/test/TEST-*-result.xml'
      archive 'build/tarball/tymly-*.tgz'
   }
}
