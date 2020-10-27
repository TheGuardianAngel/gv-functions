const { db } = require('../utils/admin');

//Get all creativeWritings on the db ----
exports.getAllCreativeWritings = (req, res) => {
  db.collection('creativeWritings')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let creativeWritings = [];
      data.forEach((doc) => {
        creativeWritings.push({
          essayId: doc.id,
          title: doc.data().title,
          body: doc.data().body,
          author: doc.data().author,
          createdAt: doc.data().createdAt,
          likes: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          userImage: doc.data().userImage,
          type: doc.data().type,
        });
      });
      return res.json(creativeWritings);
    })
    .catch((err) => console.error(err));
};

//Get all creativeWritings from a specific type ----
exports.getAllCreativeWritingsByType = (req, res) => {
  db.collection('creativeWritings')
    .where('type', '==', req.params.type)
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let creativeWritings = [];
      data.forEach((doc) => {
        creativeWritings.push({
          essayId: doc.id,
          title: doc.data().title,
          body: doc.data().body,
          author: doc.data().author,
          createdAt: doc.data().createdAt,
          likes: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          userImage: doc.data().userImage,
          type: doc.data().type,
        });
      });
      return res.json(creativeWritings);
    })
    .catch((err) => console.error(err));
};

//Get a specific creativeWriting from its id ----
exports.getCreativeWriting = (req, res) => {
  let creativeWritingData = {};
  db.doc(`/creativeWritings/${req.params.essayId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Creative writing not found!' });
      }
      creativeWritingData = doc.data();
      creativeWritingData.essayId = doc.id;
      return db.collection('comments').orderBy('createdAt', 'desc').where('essayId', '==', req.params.essayId).get();
    })
    .then((data) => {
      creativeWritingData.comments = [];
      data.forEach((doc) => {
        creativeWritingData.comments.push(doc.data());
      });
      return res.json(creativeWritingData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Post a creative writing as a user ----
exports.postCreativeWriting = (req, res) => {
  const newCreativeWriting = {
    body: req.body.body,
    title: req.body.title,
    author: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    type: req.body.type,
  };

  db.collection('creativeWritings')
    .add(newCreativeWriting)
    .then((doc) => {
      const resCreativeWriting = newCreativeWriting;
      resCreativeWriting.essayId = doc.id;
      res.json(resCreativeWriting);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong!' });
    });
};

//Update a specific creative writing ----
exports.updateCreativeWriting = (req, res) => {
  const creativeWritingDocument = db.doc(`/creativeWritings/${req.params.essayId}`);

  let creativeWritingData;

  creativeWritingDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Essay not found!' });
      }
      creativeWritingData = {
        author: doc.data().author,
        createdAt: doc.data().createdAt,
        userImage: doc.data().userImage,
        likeCount: doc.data().likeCount,
        commentCount: doc.data().commentCount,
        title: req.body.title,
        body: req.body.body,
        type: req.body.type,
        updatedAt: new Date().toISOString(),
      };
      return doc.ref.update({
        title: req.body.title,
        body: req.body.body,
        type: req.body.type,
        updatedAt: new Date().toISOString(),
      });
    })
    .then(() => {
      return res.status(200).json(creativeWritingData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ general: 'Something went wrong. Please try again.' });
    });
};

//Delete a specific creative writing from its id ----
exports.deleteCreativeWriting = (req, res) => {
  const creativeWritingDocument = db.doc(`/creativeWritings/${req.params.essayId}`);
  creativeWritingDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Creative writing not found!' });
      }
      if (doc.data().author !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return creativeWritingDocument.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Creative writing deleted successfully!' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Comment on a specific creative writing as a user ----
exports.commentOnCreativeWriting = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ comment: 'Must not be empty!' });
  }

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    essayId: req.params.essayId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/creativeWritings/${req.params.essayId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Creative writing not found!' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      return res.json(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong!' });
    });
};

//Like a specific creative writing as a user
exports.likeCreativeWriting = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('essayId', '==', req.params.essayId)
    .limit(1);

  const creativeWritingDocument = db.doc(`/creativeWritings/${req.params.essayId}`);

  let creativeWritingData;

  creativeWritingDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        creativeWritingData = doc.data();
        creativeWritingData.essayId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Creative writing not found!' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            essayId: req.params.essayId,
            userHandle: req.user.handle,
          })
          .then(() => {
            creativeWritingData.likeCount++;
            return creativeWritingDocument.update({ likeCount: creativeWritingData.likeCount });
          })
          .then(() => {
            return res.json(creativeWritingData);
          });
      } else {
        return res.status(400).json({ error: 'Creative writing already liked!' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};

//Unlike a specific essay as a user...Not to be confused with dislike...there are no dislikes
exports.unlikeCreativeWriting = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('essayId', '==', req.params.essayId)
    .limit(1);

  const creativeWritingDocument = db.doc(`/creativeWritings/${req.params.essayId}`);

  let creativeWritingData;

  creativeWritingDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        creativeWritingData = doc.data();
        creativeWritingData.essayId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Creative writing not found!' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Creative writing not liked!' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            creativeWritingData.likeCount--;
            return creativeWritingDocument.update({ likeCount: creativeWritingData.likeCount });
          })
          .then(() => {
            return res.json(creativeWritingData);
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};
