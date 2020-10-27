module.exports = (req, res, next) => {
  if (req.user.handle === 'George Vonedalm') {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized!' });
};
