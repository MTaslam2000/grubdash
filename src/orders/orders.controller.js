const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function validateUrl(req, res, next) {
  // make sure to destructure from req.params it seems to be the most reliable way or remember to call the id what you called it in the url
  //   const { orderId } = req.params;
  const order = orders.find((o) => o.id === req.params.orderId);
  if (order) {
    res.locals.order = order;
    next();
  } else {
    next({
      status: 404,
      message: `could not find order with id ${req.params.orderId}`,
    });
  }
}

function read(req, res, next) {
  const { order } = res.locals;
  res.send({ data: order });
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

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  let newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}

function update(req, res, next) {
  const { order } = res.locals;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.send({ data: order });
}

function validateStatusForDestroy(req, res, next) {
  const { order } = res.locals;
  if (order.status !== "pending") {
    next({ status: 400, message: "pending" });
  } else {
    next();
  }
}

function destroy(req, res, next) {
  const { order } = res.locals;
  const deletedOrder = orders.splice(order, 1);
  res.status(204).send();
}

function list(req, res, next) {
  res.send({ data: orders });
}

function dishesIsValidArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.length > 0 && Array.isArray(dishes)
    ? next()
    : next({ status: 400, message: `Order must include at least one dish` });
}

function quantityIsValidNumber(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.forEach((dish) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integar greater than 0`,
      });
    }
  });

  next();
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];

  !validStatus.includes(status)
    ? next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
      })
    : status === "delivered"
    ? next({ status: 400, message: `A delivered order cannot be changed` })
    : next();
}

function idPropertyIsValid(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  !id || id === orderId
    ? next()
    : next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
}

function orderIsPending(req, res, next) {
  const status = res.locals.order.status;

  status === "pending"
    ? next()
    : next({
        status: 400,
        message: `An order cannot be deleted unless it is pending`,
      });
}

module.exports = {
  list,
  read: [validateUrl, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValidArray,
    quantityIsValidNumber,
    create,
  ],
  update: [
    validateUrl,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    statusPropertyIsValid,
    dishesIsValidArray,
    quantityIsValidNumber,
    idPropertyIsValid,
    update,
  ],
  delete: [validateUrl, validateStatusForDestroy, destroy],
};
