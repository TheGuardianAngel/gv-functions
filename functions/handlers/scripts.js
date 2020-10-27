const { db } = require('../utils/admin');

//Get all scripts on the db
exports.getAllScripts = (req, res) => {
  db.collection('scripts')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let scripts = [];
      data.forEach((doc) => {
        scripts.push({
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
      return res.json(scripts);
    })
    .catch((err) => console.error(err));
};

//Get a specific script from its id
exports.getScript = (req, res) => {
  let scriptData = {};
  db.doc(`/scripts/${req.params.essayId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Script not found!' });
      }
      scriptData = doc.data();
      scriptData.essayId = doc.id;
      return db.collection('comments').orderBy('createdAt', 'desc').where('essayId', '==', req.params.essayId).get();
    })
    .then((data) => {
      scriptData.comments = [];
      data.forEach((doc) => {
        scriptData.comments.push(doc.data());
      });
      return res.json(scriptData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Post an script as a user
exports.postScript = (req, res) => {
  const newScript = {
    body: req.body.body,
    title: req.body.title,
    author: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection('scripts')
    .add(newScript)
    .then((doc) => {
      const resScript = newScript;
      resScript.essayId = doc.id;
      res.json(resScript);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong!' });
    });
};

//Update a specific script
exports.updateScript = (req, res) => {
  const scriptDocument = db.doc(`/scripts/${req.params.essayId}`);

  let scriptData;

  scriptDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Script not found!' });
      }
      scriptData = {
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
      return res.status(200).json(scriptData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ general: 'Something went wrong. Please try again.' });
    });
};

//Delete a specific script from its id
exports.deleteScript = (req, res) => {
  const scriptDocument = db.doc(`/scripts/${req.params.essayId}`);
  scriptDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Script not found!' });
      }
      if (doc.data().author !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return scriptDocument.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Script deleted successfully!' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Comment on a specific script as a user
exports.commentOnScript = (req, res) => {
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

  db.doc(`/scripts/${req.params.essayId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Script not found!' });
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

//Like a specific script as a user
exports.likeScript = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('essayId', '==', req.params.essayId)
    .limit(1);

  const scriptDocument = db.doc(`/scripts/${req.params.essayId}`);

  let scriptData;

  scriptDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        scriptData = doc.data();
        scriptData.essayId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Script not found!' });
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
            scriptData.likeCount++;
            return scriptDocument.update({ likeCount: scriptData.likeCount });
          })
          .then(() => {
            return res.json(scriptData);
          });
      } else {
        return res.status(400).json({ error: 'Script already liked!' });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};

//Unlike a specific script as a user...Not to be confused with dislike...there are no dislikes
exports.unlikeScript = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle)
    .where('essayId', '==', req.params.essayId)
    .limit(1);

  const scriptDocument = db.doc(`/scripts/${req.params.essayId}`);

  let scriptData;

  scriptDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        scriptData = doc.data();
        scriptData.essayId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Script not found!' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Script not liked!' });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            scriptData.likeCount--;
            return scriptDocument.update({ likeCount: scriptData.likeCount });
          })
          .then(() => {
            return res.json(scriptData);
          });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
      console.error(err);
    });
};
