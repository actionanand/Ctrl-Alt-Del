const mongoose = require('mongoose');

const connectMongooseUrl = process.env.DB_URL;

mongoose.connect(connectMongooseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true, 
    useCreateIndex: true,
    useFindAndModify: false
}).then(response => {
    console.log('MongoDB is connected!')
}).catch(error => {
    console.log('Unable to connect to mongoDB!')
});