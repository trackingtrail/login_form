const dotenv = require("dotenv");
dotenv.config();

const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const User = require("../app/models/user");

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    passport.use(
        "local-login",
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password",
                passReqToCallback: true
            },
            (req, email, password, done) => {
                process.nextTick(() => {
                    User.findOne({ "local.email" : email }, (err, user) => {
                        if (err)
                            return done(err);
                        if (!user)
                            return done(null, false, req.flash("loginMessage", "No User Found"));
                        if (!user.validPassword(password))
                            return done(null, false, req.flash("loginMessage", "Wrong Password"));
                        else
                            return done(null, user);
                    });
                });
            }
        )
    );

    passport.use(
        "local-signup",
        new LocalStrategy(
            {
                usernameField: "email",
                passwordField: "password",
                passReqToCallback: true,
            },

            (req, email, password, done) => {
                process.nextTick(() => {
                    User.findOne({ "local.email": email }, (err, existingUser) => {
                        if (err) return done(err);
                        if (existingUser) return done(null, false, req.flash("signupMessage", "That email is already taken"));
                        if (req.user) {
                            const user = req.user;
                            user.local.email = email;
                            user.local.password = user.generateHash(password);
                            user.save((err) => {
                                if (err) throw err;
                                return done(null, user);
                            });
                        } else {
                            const newUser = new User();
                            newUser.local.email = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.save((err) => {
                                if (err) throw err;

                                return done(null, newUser);
                            });
                        }
                    });
                });
            }
        )
    );

    passport.use(
        new FacebookStrategy(
            {
                clientID: process.env.FACEBOOK_clientID,
                clientSecret: process.env.FACEBOOK_clientSecret,
                callbackURL: process.env.FACEBOOK_callbackURL,
                passReqToCallback: true,
            },

            (req, token, refreshToken, profile, done) => {
                process.nextTick(() => {
                    if (!req.user) {
                        User.findOne({ "facebook.id": profile.id }, (err, user) => {
                            if (err) return done(err);
                            if (user) {
                                if (!user.facebook.token) {
                                    user.facebook.token = token;
                                    user.facebook.name = profile.name.givenName + " " + profile.name.familyName;
                                    user.facebook.email = profile.emails[0].value;

                                    user.save((err) => {
                                        if (err) throw err;
                                        return done(null, user);
                                    });
                                }

                                return done(null, user);
                            } else {
                                const newUser = new User();
                                newUser.facebook.id = profile.id;
                                newUser.facebook.token = token;
                                newUser.facebook.name = profile.name.givenName + " " + profile.name.familyName;
                                newUser.facebook.email = profile.emails[0].value;

                                newUser.save((err) => {
                                    if (err) throw err;
                                    return done(null, newUser);
                                });
                            }
                        });
                    } else {
                        const user = req.user;
                        user.facebook.id = profile.id;
                        user.facebook.token = token;
                        user.facebook.name = profile.name.givenName + " " + profile.name.familyName;
                        user.facebook.email = profile.emails[0].value;

                        user.save((err) => {
                            if (err) throw err;
                            return done(null, user);
                        });
                    }
                });
            }
        )
    );

    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_consumerKey,
                clientSecret: process.env.GITHUB_consumerSecret,
                callbackURL: process.env.GITHUB_callbackURL,
                passReqToCallback: true,
            },
            (req, token, tokenSecret, profile, done) => {
                process.nextTick(() => {
                    if (!req.user) {
                        User.findOne({ "github.id": profile.id }, (err, user) => {
                            if (err) return done(err);

                            if (user) {
                                if (!user.github.token) {
                                    user.github.token = token;
                                    user.github.photos = profile.photos[1];
                                    user.github.username = profile.username;

                                    user.save((err) => {
                                        if (err) throw err;
                                        return done(null, user);
                                    });
                                }

                                return done(null, user);
                            } else {
                                const newUser = new User();
                                newUser.github.id = profile.id;
                                newUser.github.token = token;
                                newUser.github.username = profile.username;

                                newUser.save((err) => {
                                    if (err) throw err;
                                    return done(null, newUser);
                                });
                            }
                        });
                    } else {
                        const user = req.user;
                        user.github.id = profile.id;
                        user.github.token = token;
                        user.github.username = profile.username;

                        user.save((err) => {
                            if (err) throw err;
                            return done(null, user);
                        });
                    }
                });
            }
        )
    );

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_clientID,
                clientSecret: process.env.GOOGLE_clientSecret,
                callbackURL: process.env.GOOGLE_callbackURL,
                passReqToCallback: true,
            },
            (req, token, refreshToken, profile, done) => {
                process.nextTick(() => {
                    if (!req.user) {
                        User.findOne({ "google.id": profile.id }, (err, user) => {
                            if (err) return done(err);
                            if (user) {
                                if (!user.google.token) {
                                    user.google.token = token;
                                    user.google.name = profile.displayName;
                                    user.google.email = profile.emails[0].value;
                                    user.save((err) => {
                                        if (err) throw err;
                                        return done(null, user);
                                    });
                                }

                                return done(null, user);
                            } else {
                                const newUser = new User();

                                newUser.google.id = profile.id;
                                newUser.google.token = token;
                                newUser.google.name = profile.displayName;
                                newUser.google.email = profile.emails[0].value;
                                newUser.save((err) => {
                                    if (err) throw err;
                                    return done(null, newUser);
                                });
                            }
                        });
                    } else {
                        const user = req.user;

                        user.google.id = profile.id;
                        user.google.token = token;
                        user.google.name = profile.displayName;
                        user.google.email = profile.emails[0].value;

                        user.save((err) => {
                            if (err) throw err;
                            return done(null, user);
                        });
                    }
                });
            }
        )
    );
};
