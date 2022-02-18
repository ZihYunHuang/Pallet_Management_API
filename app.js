const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const adminRouter = require('./routes/admin');

const programPermission = require('./middleware/programPermission');

const passport = require('passport');
const { request } = require('express');
require('./config/passport')(passport);

const app = express();
const port = 8500;
const ip_address = '192.168.22.100';

//解決跨網域存取問題
const corsOptions = {
    origin: [
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', programPermission, passport.authenticate('jwt', { session: false }), indexRouter);
app.use('/admin/users', programPermission, passport.authenticate('jwt', { session: false }), adminRouter);
app.use('/users', passport.authenticate('jwt', { session: false }), usersRouter);
app.use('/login', loginRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    // next(createError(404));
    res.status(404).send({
        status: "fail"
    })
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


app.listen(port, () => {
    console.log(`Welcome to pallet app listening at http://${ip_address}:${port}`)
})

module.exports = app;
