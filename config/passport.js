const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const prisma = require('../services/prismaClientService');

module.exports = (passport) => {
    let opts = {};
    opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken('bearer');
    opts.secretOrKey = process.env.PASSPORT_SECRET;
    passport.use(
        new jwtStrategy(opts, async function (jwt_paload, done) {
            try {
                const user = await prisma.account.findFirst({
                    where: {
                        account_number: jwt_paload.account_number,
                        active: true
                    }
                });
                if (user) {
                    done(null, user);
                } else {
                    done(null, false);
                }
            } catch (error) {
                return done(err, false);
            }
        })
    )
}