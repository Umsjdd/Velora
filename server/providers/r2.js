import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

let _client = null;

function getClient() {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

function getBucket() {
  return process.env.R2_BUCKET_NAME || 'vestora-storage';
}

export function generateKey(userId, filename) {
  const uuid = randomUUID();
  return `${userId}/${uuid}/${filename}`;
}

export async function uploadFile(key, body, contentType) {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await client.send(command);
  return { key, bucket: getBucket() };
}

export async function deleteFile(key) {
  const client = getClient();
  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  await client.send(command);
  return { key, deleted: true };
}

export async function getDownloadUrl(key, expiresIn = 3600) {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

export default {
  generateKey,
  uploadFile,
  deleteFile,
  getDownloadUrl,
};
