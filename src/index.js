const express = require('express');
require('./db/mongoose');

const userRoutes = require('./routers/users');
const taskRoutes = require('./routers/tasks');

const app = express();
const port = process.env.PORT;


app.use(express.json());
app.use(userRoutes);
app.use(taskRoutes);


app.listen(port, () => {
    console.log('App is up at ' +port);
});