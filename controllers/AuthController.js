import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authData = req.header('Authorization');
    let email = authData.split(' ')[1];
    const buff = Buffer.from(email, 'base64');
    email = buff.toString('ascii');
    const data = email.split(':');
    if (data.length !== 2) {
      return res.status(401).json({error: "Unauthorized"});
    }
    const hashed = sha1(data[1]);
    const users = dbClient.db.collection('users');
    users.findOne({email: data[0], password: hashed}, async (err, user) => {
      if (user) {
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
        res.status(200).json({token});
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    })
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      res.status(204).json({});
    } else {
      res.status(401).json({error: 'Unauthorized'});
    }
  }
}

module.exports = AuthController;
