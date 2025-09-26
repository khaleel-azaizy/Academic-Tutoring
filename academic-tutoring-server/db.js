const { MongoClient } = require('mongodb')
require('dotenv').config()

let dbConnection

module.exports = {
  connectToDb: (cb) => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/AcademicTutoring'
    MongoClient.connect(uri)
      .then(client => {
        dbConnection = client.db()
        return cb()
      })
      .catch(err => {
        console.log(err)
        return cb(err)
      })
  },
  getDb: () => dbConnection
}