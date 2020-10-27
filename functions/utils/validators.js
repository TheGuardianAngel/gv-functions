const { user } = require('firebase-functions/lib/providers/auth');

const isEmpty = (str) => {
  if (str.trim() === '') {
    return true;
  } else {
    return false;
  }
};
const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) {
    return true;
  } else {
    return false;
  }
};

exports.isEmpty = isEmpty;
exports.isEmail = isEmail;

exports.validateSignupData = (data) => {
  //Email validation
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = 'Email field must not be empty!';
  } else if (!isEmail(data.email)) {
    errors.email = 'The email must be a valid one!';
  }

  //Password validation
  if (isEmpty(data.password)) {
    errors.password = 'The password field must not be empty :P';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords must match!';
  }

  //Handle aka username/id validation
  if (isEmpty(data.handle)) {
    errors.handle = 'Must not be empty!';
  }

  //Break if errors has any keys
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.validateLoginData = (data) => {
  //Validations
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = 'Email field must not be empty!';
  }
  if (isEmpty(data.password)) {
    errors.password = 'The password field must not be empty :P';
  }
  //Break if errors has any keys
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio)) {
    userDetails.bio = data.bio;
  }
  if (!isEmpty(data.location)) {
    userDetails.location = data.location;
  }

  return userDetails;
};
