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

//To redirect the main route with formatted URL
router.get("/", (req, res) => {
  res.redirect(
    url.format({
      pathname: "/books/main",
      query: {
        page: req.query.page || 1,
        limit: 10,
      },
    })
  );
});

/* GET books listing. */
router.get(
  "/main",
  asyncHandler(async (req, res, next) => {
    let offset;
    let pageQuery = parseInt(req.query.page);
    pageQuery === 1 ? (offset = 0) : (offset = (pageQuery - 1) * 10); // 10 represents the limit of rows
    const allBooks = await Book.findAll();
    const books = await Book.findAll({
      offset,
      limit: 10,
    });
    res.render("index", { allBooks, books, title: "Books" });
  })
);

// GET new book creation
router.get(
  "/new",
  asyncHandler(async (req, res) => {
    res.render("new-book", { title: "New Book" });
  })
);

router.post(
  "/new",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.create(req.body);
      res.redirect("/");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = Book.build(req.body);
        res.render("new-book", {
          book,
          title: "New Book",
          errors: error.errors,
        });
      } else {
        throw error;
      }
    }
  })
);

router.get(
  "/book/:id",
  asyncHandler(async (req, res, next) => {
    console.log(req.params.id);
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render("update-book", { book, title: book.title });
    } else {
      next(createError(404, "No Such Article In The Data Base"));
    }
  })
);

//UPDATE entry
router.post(
  "/book/:id",
  asyncHandler(async (req, res) => {
    let book;
    let id = req.params.id;
    try {
      book = await Book.findByPk(req.params.id);
      await book.update(req.body);
      res.redirect("/");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        //let book = Book.build(req.body);
        //explicitly passing book attributes because Book.build() doesnt give
        //an id attribute to the instance saving it
        res.render("update-book", {
          book: {
            id,
            title: req.body.title,
            author: req.body.author,
            genre: req.body.genre,
            year: req.body.year,
          },
          errors: error.errors,
        });
        res.redirect("/");
      } else {
        throw error;
      }
    }
  })
);

//DELETE
router.post(
  "/book/:id/delete",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    await book.destroy();
    res.redirect("/");
  })
);

module.exports = router;
