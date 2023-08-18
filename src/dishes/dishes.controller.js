const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function validateUrl(req, res, next) {
  // make sure to destructure from req.params it seems to be the most reliable way or remember to call the id what you called it in the url
  //   const { dishId } = req.params;
  //   console.log(req.params);
  const { dishId } = req.params;
  const foundDish = dishes.find((d) => d.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `could not find order with id ${dishId}`,
  });
}

function read(req, res, next) {
  const { dish } = res.locals;
  res.send({ data: dish });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function validatePrice(req, res, next) {
  if (req.body.data.price < 0 || typeof req.body.data.price !== "number") {
    next({
      status: 400,
      message: `please pick a price higher than ${req.body.data.price}`,
    });
  }
  next();
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  let newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).send({ data: newDish });
}

function update(req, res, next) {
  const { dish } = res.locals;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.send({ data: dish });
}

function list(req, res, next) {
  res.send({ data: dishes });
}

function idPropertyIsValid(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  !id || id === dishId
    ? next()
    : next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
}

module.exports = {
  list,
  read: [validateUrl, read],
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    validatePrice,
    create,
  ],
  update: [
    validateUrl,
    idPropertyIsValid,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    validatePrice,
    update,
  ],
};
