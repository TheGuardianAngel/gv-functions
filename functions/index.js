const {
  getAllEssays,
  postEssay,
  getEssay,
  commentOnEssay,
  likeEssay,
  unlikeEssay,
  deleteEssay,
  updateEssay,
} = require('./handlers/essays');

const {
  getAllCreativeWritings,
  postCreativeWriting,
  getCreativeWriting,
  getAllCreativeWritingsByType,
  updateCreativeWriting,
  deleteCreativeWriting,
  commentOnCreativeWriting,
  likeCreativeWriting,
  unlikeCreativeWriting,
} = require('./handlers/creativeWritings');

const {
  getAllScripts,
  postScript,
  getScript,
  updateScript,
  deleteScript,
  likeScript,
  unlikeScript,
  commentOnScript,
} = require('./handlers/scripts');

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
  updateUserPassword,
} = require('./handlers/users');

const FBAuth = require('./utils/fbAuth');

const adminPermission = require('./utils/adminPermission');

const app = require('express')();

const functions = require('firebase-functions');

const { db } = require('./utils/admin');

//Essay routes
app.get('/essays', getAllEssays);
app.post('/essay', FBAuth, adminPermission, postEssay); //---Only the admin can create
app.get('/essay/:essayId', getEssay);
app.post('/essay/:essayId/update', FBAuth, adminPermission, updateEssay); //---Only the admin can update
app.delete('/essay/:essayId', FBAuth, adminPermission, deleteEssay); //---Only the admin can delete
app.get('/essay/:essayId/like', FBAuth, likeEssay);
app.get('/essay/:essayId/unlike', FBAuth, unlikeEssay);
app.post('/essay/:essayId/comment', FBAuth, commentOnEssay);

//CreativeWritings routes
app.get('/creativeWritings', getAllCreativeWritings);
app.get('/creativeWritings/:type', getAllCreativeWritingsByType);
app.post('/creativeWriting', FBAuth, adminPermission, postCreativeWriting); //---Only the admin can create
app.get('/creativeWriting/:essayId', getCreativeWriting);
app.post('/creativeWriting/:essayId/update', FBAuth, adminPermission, updateCreativeWriting); //---Only the admin can update
app.delete('/creativeWriting/:essayId', FBAuth, adminPermission, deleteCreativeWriting); //---Only the admin can delete
app.get('/creativeWriting/:essayId/like', FBAuth, likeCreativeWriting);
app.get('/creativeWriting/:essayId/unlike', FBAuth, unlikeCreativeWriting);

app.post('/creativeWriting/:essayId/comment', FBAuth, commentOnCreativeWriting);

//Script routes
app.get('/scripts', getAllScripts);
app.post('/script', FBAuth, adminPermission, postScript); //---Only the admin can create
app.get('/script/:essayId', getScript);
app.post('/script/:essayId/update', FBAuth, adminPermission, updateScript); //---Only the admin can update
app.delete('/script/:essayId', FBAuth, adminPermission, deleteScript); //---Only the admin can delete
app.get('/script/:essayId/like', FBAuth, likeScript);
app.get('/script/:essayId/unlike', FBAuth, unlikeScript);
app.post('/script/:essayId/comment', FBAuth, commentOnScript);

//User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.get('/user/:handle/resetPassword', updateUserPassword);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

// Essay triggers
exports.createNotificationOnEssayLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/essays/${snapshot.data().essayId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().author !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().author,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            essayId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });
exports.deleteNotificationOnUnlike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnEssayComment = functions
  .region('europe-west1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/essays/${snapshot.data().essayId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().author !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().author,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            essayId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.onUserImageChangeEssay = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection('essays')
        .where('author', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const essay = db.doc(`/essays/${doc.id}`);
            batch.update(essay, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else {
      return true;
    }
  });

exports.onEssayDelete = functions
  .region('europe-west1')
  .firestore.document('/essays/{essayId}')
  .onDelete((snapshot, context) => {
    const essayId = context.params.essayId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('essayId', '==', essayId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('essayId', '==', essayId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('essayId', '==', essayId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });

//Creative writings triggers
exports.createNotificationOnCreativeWritingLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/creativeWritings/${snapshot.data().essayId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().author !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().author,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            essayId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnCreativeWritingComment = functions
  .region('europe-west1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/creativeWritings/${snapshot.data().essayId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().author !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().author,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            essayId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.onUserImageChangeCreativeWriting = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection('creativeWritings')
        .where('author', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const essay = db.doc(`/creativeWritings/${doc.id}`);
            batch.update(essay, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else {
      return true;
    }
  });

exports.onCreativeWritingDelete = functions
  .region('europe-west1')
  .firestore.document('/creativeWritings/{essayId}')
  .onDelete((snapshot, context) => {
    const essayId = context.params.essayId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('essayId', '==', essayId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('essayId', '==', essayId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('essayId', '==', essayId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });

//Scripts triggers
exports.createNotificationOnScriptLike = functions
  .region('europe-west1')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/scripts/${snapshot.data().essayId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().author !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().author,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            essayId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnScriptComment = functions
  .region('europe-west1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/scripts/${snapshot.data().essayId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().author !== snapshot.data().userHandle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().author,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            essayId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.onUserImageChangeScript = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection('scripts')
        .where('author', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const essay = db.doc(`/scripts/${doc.id}`);
            batch.update(essay, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else {
      return true;
    }
  });

exports.onScriptDelete = functions
  .region('europe-west1')
  .firestore.document('/scripts/{essayId}')
  .onDelete((snapshot, context) => {
    const essayId = context.params.essayId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('essayId', '==', essayId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('essayId', '==', essayId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('essayId', '==', essayId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });
