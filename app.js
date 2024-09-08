const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const auRoutes = require('./routes/auRoutes');
const bookRoutes = require('./routes/bookRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const eventRoutes = require('./routes/eventRoutes');  
const clubRoutes = require('./routes/clubRoutes');    
const duelRoutes = require('./routes/duelRoutes');    
const reviewRoutes = require('./routes/reviewRoutes');

require('dotenv').config();


const app = express();
app.use(bodyParser.json());
app.use(cors());


app.use('/api/auth', authRoutes);
app.use('/api', bookRoutes);
app.use('/api', libraryRoutes);
app.use('/api', auRoutes);
app.use('/api', eventRoutes);  
app.use('/api', clubRoutes);   
app.use('/api', reviewRoutes);
app.use('/api', duelRoutes);


sequelize.sync({force: false}).then(() => {
    app.listen(3000, '0.0.0.0', () => {
        console.log('Сервер запущен на порту 3000');
    });
});
