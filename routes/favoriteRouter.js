const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");
const _ = require("lodash");

const favoriteRouter = express.Router();

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("favorites.user")
      .populate("favorites.campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    (req, res, next) => {
      Favorite.findOne({ user: req.user._id }).then(favorite => {
        if (favorite) {
          console.log("Favorite list exists - adding to it")
          req.body.forEach(thisFavorite => {
            if (!favorite.campsites.includes(thisFavorite)) {
              favorite.campsites.push(thisFavorite)
            }
          })
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          console.log("Favorite list doesn't yet exist - let's create one!")
          Favorite.create({ user: req.user._id, campsites: req.body }).then(favorite => {
            favorite
              .save()
              .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
              })
              .catch((err) => next(err));
          })
        }
      })
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end(
        `PUT operation not supported on ${req.params.campsiteId}/comments`
      );
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    (req, res) => {
      Favorite.findOneAndDelete().then(favorite => {
        if (favorite) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        } else {
          res.statusCode = 200
          res.setHeader("Content-Type", "text/plain")
          res.end("You have no favorites to delete")
        }
      })
    }
  );

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end(
        `GET operation not supported on /favorites/${req.params.campsiteId}`
      );
    }
  )
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        console.log("Favorite list exists - adding to it");
        const newFavorite = req.params.campsiteId;
        if (favorite.campsites.includes(newFavorite)) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("This favorite is already on your list");
        } else {
          favorite.campsites.push(newFavorite);
        }
        favorite
          .save()
          .then((favorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
          .catch((err) => next(err));
      } else {
        console.log("Favorite list doesn't yet exist - let's create one!");
        Favorite.create({
          user: req.user._id,
          campsites: [{ _id: req.params.campsiteId }],
        }).then((favorite) => {
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        });
      }
    });
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res) => {
      res.statusCode = 403;
      res.end(
        `PUT operation not supported on /favorites/${req.params.campsiteId}`
      );
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    (req, res, next) => {
      Favorite.findOne({ user: req.user._id }).then((favorite) => {
        if (favorite) {
          const favoriteToDelete = req.params.campsiteId;
          if (favorite.campsites.includes(favoriteToDelete)) {
            const deleteIndex = favorite.campsites.indexOf(favoriteToDelete)
            console.log(`deleting favorite at index ${deleteIndex}`)
            favorite.campsites.splice(deleteIndex, 1)
            favorite.save().then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            });
          } else {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end(
              `${req.params.campsiteId} is already not in your favorites`
            );
          }
        } else {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end(`You don't have any favorites`);
        }
      });
    }
  );

  module.exports = favoriteRouter