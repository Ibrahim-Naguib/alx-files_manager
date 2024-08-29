import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import { promises as fs } from 'fs';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (userId) {
      const users = dbClient.db.collection('users');
      const idObj = new ObjectID(userId);
      const user = await users.findOne({ _id: idObj })
      if (user) {
        const { name } = req.body;
        const { type } = req.body;
        const { parentId } = req.body;
        const isPublic = req.body.isPublic || false;
        const { data } = req.body;

        if (!name) {
          return res.status(400).json({ error: 'Missing name' });
        }
        if (!type) {
          return res.status(400).json({ error: 'Missing type' });
        }
        if (type !== 'folder' && !data) {
          return res.status(400).json({ error: 'Missing data' });
        }
        const files = dbClient.db.collection('files');
        if (parentId) {
          const idObj = new ObjectID(parentId);
          const file = await files.findOne({ _id: idObj, userId: user._id });
          if (!file) {
            return res.status(400).json({ error: 'Parent not found' });
          }
          if (file.type !== 'folder') {
            return res.status(400).json({ error: 'Parent is not a folder' });
          }
          if (type === 'folder') {
            files.insertOne({
              userId: user._id,
              name,
              type,
              parentId: parentId || 0,
              isPublic,
            })
            .then((result) => {
              res.status(201).json({
                id: result.insertedId,
                userId: user._id,
                name,
                type,
                isPublic,
                parentId: parentId || 0,
              })
            }).catch((error) => {
              console.log(error);
            });
          } else {
            const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
            const fileName = `${filePath}/${uuidv4()}`;
            const buff = Buffer.from(data, 'base64');
            try {
              try {
                await fs.mkdir(filePath, { recursive: true });
              } catch (error) {
                console.log(error);
              }
              await fs.writeFile(fileName, buff, 'utf-8');
            } catch (error) {
              console.log(error);
            }
            files.insertOne({
              userId: user._id,
              name,
              type,
              isPublic,
              parentId: parentId || 0,
              localPath: fileName,
            })
            .then((result) => {
              res.status(201).json({
                id: result.insertedId,
                userId: user._id,
                name,
                type,
                isPublic,
                parentId: parentId || 0,
              });
            })
            .catch((error) => {
              console.log(error);
            });
          }
        }
      }
    } else {
      return res.status(400).json({ error: 'Parent not found' });
    }
  }
}

module.exports = FilesController;
