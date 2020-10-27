let db = {
  users: [
    {
      userId: 'asew754qdc376574254x',
      email: 'user@gmail.com',
      handle: 'user',
      createdAt: '2020-07-02T12:31:20.905Z',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/george-vonedalm.appspot.com/o/248405180616.jpeg?alt=media',
      bio: 'Hi, FU!',
      location: 'U Genkata',
    },
  ],
  essays: [
    {
      author: 'GV',
      title: 'I am title',
      body: 'I am bdy',
      cratedAt: '2020-06-29T15:29:27.055Z',
      userImage:
        'https://firebasestorage.googleapis.com/v0/b/george-vonedalm.appspot.com/o/248405180616.jpeg?alt=media',
      likeCount: '69',
      commentCount: '420',
    },
  ],
  creativeWritings: [
    {
      author: 'GV',
      title: 'I am title',
      body: 'I am bdy',
      cratedAt: '2020-06-29T15:29:27.055Z',
      userImage:
        'https://firebasestorage.googleapis.com/v0/b/george-vonedalm.appspot.com/o/248405180616.jpeg?alt=media',
      likeCount: '69',
      commentCount: '420',
      type: 'play | potry | microfiction',
    },
  ],
  scripts: [
    {
      author: 'GV',
      title: 'I am title',
      body: 'I am bdy',
      cratedAt: '2020-06-29T15:29:27.055Z',
      userImage: 'https://firebasestorage.googleapis.com/v0/b/george-vonedalm.appspot.com/o/no-image.png?alt=media',
      likeCount: '69',
      commentCount: '420',
    },
  ],
  comments: [
    {
      userHandle: 'user',
      essayId: 'o6qd2jJIEz07BLy3yxFL', // or scriptId or creativeWritingId
      body: 'Noice one m8!',
      createdAt: '2020-06-29T15:29:27.055Z',
    },
  ],
  notifications: [
    {
      recipient: 'user',
      sender: 'john',
      read: 'true | false',
      essayId: 'o6qd2jJIEz07BLy3yxFL', // or scriptId or creativeWritingId
      type: 'like | comment',
      createdAt: '2020-07-03T13:54:39.965Z',
    },
  ],
};

let userDetails = {
  // Redux data
  credentails: {
    userId: 'asew754qdc376574254x',
    email: 'user@gmail.com',
    handle: 'user',
    createdAt: '2020-07-02T12:31:20.905Z',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/george-vonedalm.appspot.com/o/248405180616.jpeg?alt=media',
    bio: 'Hi, FU!',
    location: 'U Genkata',
  },
  likes: [
    {
      userHandle: 'user69',
      essayId: 'o6qd2jJIEz07BLy3yxFL', // or scriptId or creativeWritingId
    },
    {
      userHandle: 'user',
      essayId: 'o6qd2jJIEz07BLy3yxFL', // or scriptId or creativeWritingId
    },
  ],
};
