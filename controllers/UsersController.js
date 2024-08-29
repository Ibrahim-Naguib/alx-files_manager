import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectID } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({error: 'Missing email'});
    }
    if (!password) {
      return res.status(400).json({error: 'Missing password'});
    }
    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, user) => {
      if (user) {
        res.status(400).json({error: 'Already exist'});
      } else {
        const hashed = sha1(password);
        users.insertOne({
          email,
          password: hashed,
        }).then((result) => {
          res.status(201).json({id: result.insertedId, email});
          userQueue.add({ userId: result.insertedId });
        }).catch((error) => {
          console.log(error);
        });
      }
    });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      const users = dbClient.db.collection('users');
      const idObj = new ObjectID(id);
      users.findOne({_id: idObj}, (err, user) => {
        if (user) {
          res.status(200).json({id: id, email: user.email});
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = UsersController;
