var express = require("express");
const url = require("url");
var createError = require("http-errors");
const { Op } = require("sequelize");
var Book = require("../models").Book;
var router = express.Router();

/* AsyncHandler */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

//To redirect the search route with formatted URL
router.get("/", (req, res) => {
  res.redirect(
    url.format({
      pathname: "/search/query",
      query: {
        search: req.query.search,
        page: req.query.page || 1,
        limit: 10,
      },
    })
  );
});

router.get(
  "/query",
  asyncHandler(async (req, res, next) => {
    let offset;
    let searchQuery = req.query.search;
    //To manage the query offset to the database according to the URL query
    let pageQuery = parseInt(req.query.page);
    pageQuery === 1 ? (offset = 0) : (offset = (pageQuery - 1) * 10);

    //no query to the DB will be made if the search field is empty.
    //instead redirects to the main list
    if (searchQuery.trim().length === 0) {
      res.redirect("/");
    }

    //To get the length of book list according to the search input
    //for paging purposes purpuses (check index-search.pug)
    let searchedBooks = await Book.findAll({
      where: {
        [Op.or]: {
          title: {
            [Op.like]: `%${searchQuery}%`,
          },
          author: {
            [Op.like]: `%${searchQuery}%`,
          },
          genre: {
            [Op.like]: `%${searchQuery}%`,
          },
          year: {
            [Op.like]: `%${searchQuery}%`,
          },
        },
      },
    });

    //Query the DB 10 books at a time according to search input for display puposes
    let books = await Book.findAll({
      where: {
        [Op.or]: {
          title: {
            [Op.like]: `%${searchQuery}%`,
          },
          author: {
            [Op.like]: `%${searchQuery}%`,
          },
          genre: {
            [Op.like]: `%${searchQuery}%`,
          },
          year: {
            [Op.like]: `%${searchQuery}%`,
          },
        },
      },
      offset,
      limit: 10,
    });

    //To check the search query came back empty and displays appropriate message
    if (books.length === 0) {
      res.render("index-search", {
        text:
          "Sorry! The Book You Are Looking For Does Not Exist In Out Data Base",
      });
    }

    res.render("index-search", {
      books,
      searchedBooks,
      title: `Book Search for: "${searchQuery}" `,
      search: searchQuery,
    });
  })
);

module.exports = router;
