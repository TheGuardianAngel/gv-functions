const { db } = require('../utils/admin');

//Get all essays on the db
exports.getAllEssays = (req, res) => {
  db.collection('essays')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let essays = [];
      data.forEach((doc) => {
        essays.push({
          essayId: doc.id,
          title: doc.data().title,
          body: doc.data().body,
          author: doc.data().author,
          createdAt: doc.data().createdAt,
          likes: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          userImage: doc.data().userImage,
        });
      });
      return res.json(essays);
    })
    .catch((err) => console.error(err));
};

//Get a specific essay from its id
exports.getEssay = (req, res) => {
  let essayData = {};
  db.doc(`/essays/${req.params.essayId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Essay not found!' });
      }
      essayData = doc.data();
      essayData.essayId = doc.id;
      return db.collection('comments').orderBy('createdAt', 'desc').where('essayId', '==', req.params.essayId).get();
    })
    .then((data) => {
      essayData.comments = [];
      data.forEach((doc) => {
        essayData.comments.push(doc.data());
      });
      return res.json(essayData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Post an essay as a user
exports.postEssay = (req, res) => {
  const newEsssay = {
    body: req.body.body,
    title: req.body.title,
    author: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection('essays')
    .add(newEsssay)
    .then((doc) => {
      const resEssay = newEsssay;
      resEssay.essayId = doc.id;
      res.json(resEssay);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong!' });
    });
};

//Update a specific essay
exports.updateEssay = (req, res) => {
  const essayDocument = db.doc(`/essays/${req.params.essayId}`);

  let essayData;

  essayDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Essay not found!' });
      }
      essayData = {
        author: doc.data().author,
        createdAt: doc.data().createdAt,
        userImage: doc.data().userImage,
        likeCount: doc.data().likeCount,
        commentCount: doc.data().commentCount,
        title: req.body.title,
        body: req.body.body,
        updatedAt: new Date().toISOString(),
      };
      return doc.ref.update({
        title: req.body.title,
        body: req.body.body,
        updatedAt: new Date().toISOString(),
      });
    })
    .then(() => {
      return res.status(200).json(essayData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ general: 'Something went wrong. Please try again.' });
    });
};

//Delete a specific essay from its id
exports.deleteEssay = (req, res) => {
  const essayDocument = db.doc(`/essays/${req.params.essayId}`);
  essayDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Essay not found!' });
      }
      if (doc.data().author !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return essayDocument.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Essay deleted successfully!' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Comment on a specific essay as a user
exports.commentOnEssay = (req, res) => {
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

  db.doc(`/essays/${req.params.essayId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Essay not found!' });
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

//Like a specific essay as a user
exports.likeEssay = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('essayId', '==', req.params.essayId)
    .limit(1);

  const essayDocument = db.doc(`/essays/${req.params.essayId}`);

  let essayData;

  essayDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        essayData = doc.data();
        essayData.essayId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Essay not found!' });
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
            essayData.likeCount++;
            return essayDocument.update({ likeCount: essayData.likeCount });
          })
          .then(() => {
            return res.json(essayData);
          });
      } else {
        return res.status(400).json({ error: 'Essay already liked!' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};

//Unlike a specific essay as a user...Not to be confused with dislike...there are no dislikes
exports.unlikeEssay = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('essayId', '==', req.params.essayId)
    .limit(1);

  const essayDocument = db.doc(`/essays/${req.params.essayId}`);

  let essayData;

  essayDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        essayData = doc.data();
        essayData.essayId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Essay not found!' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Essay not liked!' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            essayData.likeCount--;
            return essayDocument.update({ likeCount: essayData.likeCount });
          })
          .then(() => {
            return res.json(essayData);
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};
